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

async def _discover_devices_async() -> list:
    """Discover Sonos devices in thread pool to avoid blocking"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: list(soco.discover() or []))

async def _subscribe_to_device_events(device, ws) -> None:
    try:
        device_name = device.player_name
        if device_name in subscriptions:
            logger.info(f"Already subscribed to {device_name}")
            return

        logger.info(f"Subscribing to events from {device_name}")
        
        sub_rendering = await device.renderingControl.subscribe()
        sub_transport = await device.avTransport.subscribe()
        
        def on_rendering_event(event):
            """Handle rendering control events (volume, mute, etc)"""
            try:
                if state and "Volume" in event.variables:
                    volume = event.variables.get("Volume", {}).get("Master")
                    if volume is not None:
                        logger.debug(f"Volume event from {device_name}: {volume}")
                        # Optionally sync volume to clients
                        state.volume = int(volume)
            except Exception as e:
                logger.error(f"Error handling rendering event: {e}")
        
        def on_transport_event(event):
            """Handle transport events (play, pause, track change, etc)"""
            title = None
            artist = None
            album_art = None
            parent_name = None
            parent_art = None

            if not state and state.active_device == device:
                return
            
            metadata = event.variables.get("current_track_meta_data")
            enqueued_metadata = event.variables.get("enqueued_transport_uri_meta_data")

            if metadata and hasattr(metadata, "title") and hasattr(metadata, "creator") and hasattr(metadata, "album_art_uri"):
                title = metadata.title
                artist = metadata.creator
                album_art = state.active_device.music_library.build_album_art_full_uri(
                    metadata.album_art_uri
                )

            # Applies to radio streams where title/artist are in stream_content
            elif enqueued_metadata and enqueued_metadata.title:
                if hasattr(metadata, "stream_content"):
                    title = metadata.stream_content
                else:
                    title = enqueued_metadata.title

                artist = enqueued_metadata.title
                album_art = state.active_device.music_library.build_album_art_full_uri(
                    metadata.album_art_uri
                )

            send_event = manager.send_event(Event(type="play", data={
                "track_info": {
                    "title": title,
                    "artist": artist,
                    "album_art": album_art,
                }
            }), ws)

            asyncio.create_task(send_event)
        
        sub_rendering.callback = on_rendering_event
        sub_transport.callback = on_transport_event
        
        subscriptions[device_name] = {
            "rendering": sub_rendering,
            "transport": sub_transport,
        }
        logger.info(f"Subscribed to {device_name}")
    except Exception as e:
        logger.error(f"Failed to subscribe to {device}: {e}")


async def _unsubscribe_from_all_devices() -> None:
    """Unsubscribe from all device events"""
    for device_name, subs in subscriptions.items():
        try:
            logger.info(f"Unsubscribing from {device_name}")
            await subs["rendering"].unsubscribe()
            await subs["transport"].unsubscribe()
        except Exception as e:
            logger.error(f"Error unsubscribing from {device_name}: {e}")
    
    subscriptions.clear()
    
    try:
        await events_asyncio.event_listener.async_stop()
        logger.info("Event listener stopped")
    except Exception as e:
        logger.error(f"Error stopping event listener: {e}")

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
    
    # Shutdown
    logger.info("Shutting down TuneHub server...")
    await _unsubscribe_from_all_devices()


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
        await _subscribe_to_device_events(state.active_device, ws)

    try:
        # Sync current state to new client
        await state.sync_all()

        # Main message loop
        while True:
            msg = await ws.receive_json()
            action = Action(**msg)
            logger.debug(f"Received action: {action.type}")
            await dispatch_action(action.type, manager, ws, state, action.data)
    
    except WebSocketDisconnect:
        manager.disconnect(ws)
        # await _unsubscribe_from_all_devices()
        logger.info(f"Client disconnected. Active connections: {len(manager.active_connections)}")
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