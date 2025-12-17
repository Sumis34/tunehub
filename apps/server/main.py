from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Any, Dict, List, Optional, Callable
import soco
from starlette.responses import FileResponse 
from sonos import get_playable_favorites, play_favorite
from state import StateManager
from connection import ConnectionManager, Action, Event

app = FastAPI()

manager = ConnectionManager()
state = StateManager(manager)

discovered = list(soco.discover() or [])
state.devices = discovered
state.active_device = discovered[0] if discovered else None
state.favorites = get_playable_favorites(state.active_device) if state.active_device else []

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)

    discovered = list(soco.discover() or [])
    state.devices = discovered

    await state.sync_all()

    try:
        while True:
            msg = await ws.receive_json()
            action = Action(**msg)  # validate
            print(f"Received action: {action}")
            # handle action
            if action.type == "ping":
                await manager.send_event(Event(type="pong", data={}), ws)
            elif action.type == state.event_names.ACTIVE_DEVICE.value:
                device_name = action.data.get("device_name")
                matching_device = next((d for d in state.devices if d.player_name == device_name), None)
                if matching_device:
                    state.active_device = matching_device  # Auto-syncs to all clients
                else:
                    await manager.send_event(Event(type="error", data={"message": "Device not found"}), ws)
            elif action.type == "play":
                favorite_id = action.data.get("favorite_id")

                if state.active_device and favorite_id:
                    title, item_class, ref = next((fav for fav in state.favorites if fav[3] == favorite_id), None)

                    print(title)

                    if not title:
                        await manager.send_event(Event(type="error", data={"message": "Favorite not found"}), ws)
                        continue

                    play_favorite(state.active_device, title, item_class, ref)  # Auto-syncs to all clients
                    await manager.send_event(Event(type="playing", data={"favorite_id": favorite_id}), ws)
                else:
                    await manager.send_event(Event(type="error", data={"message": "No active device or favorite ID"}), ws)
            elif action.type == "echo":
                await manager.send_event(Event(type="echo", data={"message": action.data.get("message")}), ws)
            elif action.type == state.event_names.VOLUME.value:
                new_volume = action.data.get("volume")
                if isinstance(new_volume, int) and 0 <= new_volume <= 100:
                    state.volume = new_volume  # Auto-syncs to all clients
                else:
                    await manager.send_event(Event(type="error", data={"message": "Invalid volume"}), ws)

            else:
                await manager.send_event(Event(type="error", data={"message": "Unknown action"}), ws)
    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("Client disconnected")

@app.get("/")
async def root():
    return FileResponse('index.html')