import asyncio
import logging
from contextlib import asynccontextmanager
import soco
from soco import events_asyncio
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, Response
from sonos import get_playable_favorites
from state import StateManager
from connection import ConnectionManager, Action
from handlers import dispatch_action
from connection import Event

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set up SoCo async events
soco.config.EVENTS_MODULE = events_asyncio

# Global state
manager: ConnectionManager | None = None
state: StateManager | None = None
subscriptions: dict = {}
subscriptions_lock = asyncio.Lock()

# Subscription retry configuration
MAX_SUBSCRIPTION_RETRIES = 3
SUBSCRIPTION_RETRY_BASE_DELAY = 2.0  # seconds

async def _discover_devices_async() -> list:
    """Discover Sonos devices in thread pool to avoid blocking"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: list(soco.discover() or []))


async def _unsubscribe_from_device(device_name: str, stop_listener: bool = False) -> None:
    """Unsubscribe from a single device's event streams."""
    async with subscriptions_lock:
        subs = subscriptions.pop(device_name, None)

    if not subs:
        return

    try:
        logger.info(f"Unsubscribing from {device_name}")
        await subs["rendering"].unsubscribe()
        await subs["transport"].unsubscribe()
    except Exception as e:
        logger.error(f"Error unsubscribing from {device_name}: {e}")

    if not stop_listener or subscriptions:
        # Only stop event listener when explicitly requested and no subscriptions remain
        return

    try:
        await events_asyncio.event_listener.async_stop()
        logger.info("Event listener stopped")
    except Exception as e:
        logger.error(f"Error stopping event listener: {e}")


async def _subscribe_to_device_events(device) -> None:
    """
    Subscribe to a device's rendering and transport events.
    Events are broadcast to all connected clients.
    Includes retry logic with exponential backoff.
    """
    device_name = device.player_name

    for attempt in range(MAX_SUBSCRIPTION_RETRIES):
        try:
            # Check if already subscribed
            async with subscriptions_lock:
                if device_name in subscriptions:
                    logger.info(f"Already subscribed to {device_name}")
                    return

            logger.info(f"Subscribing to {device_name} (attempt {attempt + 1}/{MAX_SUBSCRIPTION_RETRIES})")

            sub_rendering = await device.renderingControl.subscribe()
            sub_transport = await device.avTransport.subscribe()

            def on_rendering_event(event):
                """Handle rendering control events (volume, mute, etc)"""
                try:
                    if not state or not manager:
                        return

                    if "Volume" in event.variables:
                        volume = event.variables.get("Volume", {}).get("Master")
                        if volume is not None:
                            logger.debug(f"Volume event from {device_name}: {volume}")
                            state.volume = int(volume)
                except Exception as e:
                    logger.error(f"Error handling rendering event from {device_name}: {e}")

            def on_transport_event(event):
                """Handle transport events (play, pause, track change, etc)"""
                try:
                    if not state or not manager or state.active_device != device:
                        return

                    title = None
                    artist = None
                    album_art = None

                    metadata = event.variables.get("current_track_meta_data")
                    enqueued_metadata = event.variables.get("enqueued_transport_uri_meta_data")

                    if metadata and hasattr(metadata, "title") and hasattr(metadata, "creator"):
                        title = metadata.title
                        artist = metadata.creator

                        if hasattr(metadata, "album_art_uri") and metadata.album_art_uri:
                            try:
                                album_art = state.active_device.music_library.build_album_art_full_uri(
                                    metadata.album_art_uri
                                )
                            except Exception as e:
                                logger.debug(f"Failed to build album art URI: {e}")

                    elif enqueued_metadata and hasattr(enqueued_metadata, "title") and enqueued_metadata.title:
                        if metadata and hasattr(metadata, "stream_content"):
                            title = metadata.stream_content
                        else:
                            title = enqueued_metadata.title

                        artist = enqueued_metadata.title

                        if metadata and hasattr(metadata, "album_art_uri") and metadata.album_art_uri:
                            try:
                                album_art = state.active_device.music_library.build_album_art_full_uri(
                                    metadata.album_art_uri
                                )
                            except Exception as e:
                                logger.debug(f"Failed to build album art URI for radio: {e}")

                    track_info = {
                        "title": title,
                        "artist": artist,
                        "album_art": album_art,
                    }

                    state.track_info = track_info
                    broadcast = manager.broadcast(Event(type="play", data={"track_info": track_info}))
                    asyncio.create_task(broadcast)

                except Exception as e:
                    logger.error(f"Error handling transport event from {device_name}: {e}")

            sub_rendering.callback = on_rendering_event
            sub_transport.callback = on_transport_event

            async with subscriptions_lock:
                subscriptions[device_name] = {
                    "rendering": sub_rendering,
                    "transport": sub_transport,
                }

            logger.info(f"Successfully subscribed to {device_name}")
            return

        except Exception as e:
            logger.warning(f"Subscription attempt {attempt + 1} failed for {device_name}: {e}")

            if attempt < MAX_SUBSCRIPTION_RETRIES - 1:
                delay = SUBSCRIPTION_RETRY_BASE_DELAY * (2 ** attempt)
                logger.info(f"Retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                logger.error(f"Failed to subscribe to {device_name} after {MAX_SUBSCRIPTION_RETRIES} attempts")


async def _unsubscribe_from_all_devices(stop_listener: bool = True) -> None:
    """Unsubscribe from all device events and optionally stop event listener"""
    async with subscriptions_lock:
        items = list(subscriptions.items())
        subscriptions.clear()

    # Unsubscribe with timeout to prevent hanging during shutdown
    for device_name, subs in items:
        try:
            await asyncio.wait_for(
                asyncio.gather(
                    subs["rendering"].unsubscribe(),
                    subs["transport"].unsubscribe(),
                    return_exceptions=True
                ),
                timeout=2.0
            )
        except asyncio.TimeoutError:
            pass  # Silently skip on timeout during shutdown
        except Exception:
            pass  # Suppress all exceptions during shutdown

    if not stop_listener:
        return

    try:
        await asyncio.wait_for(
            events_asyncio.event_listener.async_stop(),
            timeout=3.0
        )
    except (asyncio.TimeoutError, Exception):
        pass  # Suppress all exceptions during shutdown

@asynccontextmanager
async def lifespan(app: FastAPI):
    global manager, state
    
    # Startup
    logger.info("Starting TuneHub server...")
    manager = ConnectionManager()
    state = StateManager(manager)
    
    # Discover devices and subscribe to events
    try:
        devices = await _discover_devices_async()
        state.devices = devices
        state.active_device = devices[0] if devices else None
        
        logger.info(f"Discovered {len(devices)} device(s)")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
    
    yield
    
    print("Shutting down TuneHub server...", flush=True)
    try:
        await asyncio.wait_for(_unsubscribe_from_all_devices(), timeout=5.0)
        print("Shutdown complete", flush=True)
    except asyncio.TimeoutError:
        print("Shutdown timed out, forcing exit", flush=True)
    except Exception:
        pass


app = FastAPI(title="TuneHub", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """WebSocket endpoint for real-time Sonos control"""
    if not manager or not state:
        await ws.close(code=1008, reason="Server not initialized")
        return
    
    await manager.connect(ws)
    logger.info(f"Client connected. Active connections: {len(manager.active_connections)}")

    if state.active_device:
        state.favorites = get_playable_favorites(state.active_device)
        await _subscribe_to_device_events(state.active_device)

    try:
        # Sync current state to new client (including cached track info)
        await state.sync_all()

        # Main message loop
        while True:
            msg = await ws.receive_json()
            action = Action(**msg)
            logger.debug(f"Received action: {action.type}")
            await dispatch_action(action.type, manager, ws, state, action.data)

    except WebSocketDisconnect:
        manager.disconnect(ws)
        logger.info(f"Client disconnected. Active connections: {len(manager.active_connections)}")

        # Cleanup subscriptions when last client disconnects
        if not manager.active_connections:
            logger.info("Last client disconnected, unsubscribing from all devices")
            await _unsubscribe_from_all_devices(stop_listener=True)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(ws)


@app.get("/proxy")
async def proxy_image(url: str = Query(..., description="URL to proxy")):
    """Proxy endpoint for cover art and images from Sonos devices"""
    try:
        if not url.startswith(("http://", "https://")):
            raise ValueError("Invalid URL scheme")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "application/octet-stream")
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*"
                }
            )
    except Exception as e:
        logger.warning(f"Proxy request failed for {url}: {e}")
        # Fallback to empty placeholder
        try:
            with open("./assets/empty.png", "rb") as f:
                return Response(
                    content=f.read(),
                    media_type="image/png",
                    headers={
                        "Cache-Control": "public, max-age=3600",
                        "Access-Control-Allow-Origin": "*"
                    }
                )
        except Exception:
            return Response(status_code=404)


@app.get("/")
async def root():
    """Serve frontend index.html"""
    return FileResponse('index.html')