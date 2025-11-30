from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Any, Dict, List
import soco
from starlette.responses import FileResponse 

app = FastAPI()

# Pydantic schemas for safety
class Action(BaseModel):
    type: str
    data: Dict[str, Any] = {}

class Event(BaseModel):
    type: str
    data: Dict[str, Any] = {}

# Connection manager for multiple clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active_connections.remove(ws)

    async def send_event(self, event: Event, ws: WebSocket):
        await ws.send_json(event.dict())

    async def broadcast(self, event: Event):
        for connection in self.active_connections:
            await self.send_event(event, connection)

manager = ConnectionManager()

state = {
    "volume": 50,
    "devices": [],
    "active_device": None,
}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)

    state["devices"] = [device.player_name for device in soco.discover()]
    state["active_device"] = state["devices"][0] if state["devices"] else None

    await manager.send_event(Event(type="volume", data=state["volume"]), ws)
    await manager.send_event(Event(type="devices", data=state["devices"]), ws)
    await manager.send_event(Event(type="active-device", data=state["active_device"]), ws)

    try:
        while True:
            msg = await ws.receive_json()
            action = Action(**msg)  # validate
            print(f"Received action: {action}")
            # handle action
            if action.type == "ping":
                await manager.send_event(Event(type="pong", data={}), ws)
            elif action.type == "echo":
                await manager.send_event(Event(type="echo", data={"message": action.data.get("message")}), ws)
            elif action.type == "adjust-volume":
                new_volume = action.data.get("volume")
                if isinstance(new_volume, int) and 0 <= new_volume <= 100:
                    state["volume"] = new_volume
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