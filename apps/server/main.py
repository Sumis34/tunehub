# server.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Any, Dict, List

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

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
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
            else:
                await manager.send_event(Event(type="error", data={"message": "Unknown action"}), ws)
    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("Client disconnected")
