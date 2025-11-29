from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Any, Dict, List
import soco

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
}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    await manager.send_event(Event(type="adjust-volume", data={"volume": state["volume"]}), ws)
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
            elif action.type == "discover":
                devices = soco.discover()
                state["devices"] = [device.player_name for device in devices]
                await manager.send_event(Event(type="devices", data={"devices": state["devices"]}), ws)

            else:
                await manager.send_event(Event(type="error", data={"message": "Unknown action"}), ws)
    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("Client disconnected")

@app.get("/")
async def root():
    return {"message": "TuneHub Server is running"}