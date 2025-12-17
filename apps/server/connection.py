from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class Action(BaseModel):
    type: str
    data: Dict[str, Any] = {}

class Event(BaseModel):
    type: str
    data: Any

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections:
            self.active_connections.remove(ws)

    async def send_event(self, event: Event, ws: WebSocket):
        try:
            await ws.send_json(event.dict())
        except (WebSocketDisconnect, RuntimeError):
            # Socket is closed or cannot send anymore; remove it
            if ws in self.active_connections:
                self.active_connections.remove(ws)
            # Do not re-raise; treat as a stale connection

    async def broadcast(self, event: Event):
        # Create a copy to avoid modification during iteration
        connections = self.active_connections.copy()

        for connection in connections:
            try:
                await self.send_event(event, connection)
            except Exception:
                # send_event already removes bad connections; ignore any leftover errors
                pass

