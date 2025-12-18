from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import soco
import httpx
from starlette.responses import FileResponse, Response 
from sonos import get_playable_favorites
from state import StateManager
from connection import ConnectionManager, Action
from handlers import dispatch_action
    
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

manager = ConnectionManager()
state = StateManager(manager)

state.favorites = get_playable_favorites(state.active_device) if state.active_device else []

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)

    discovered = list(soco.discover() or [])
    state.devices = discovered
    state.active_device = discovered[0] if discovered else None

    await state.sync_all()

    try:
        while True:
            msg = await ws.receive_json()

            action = Action(**msg)
            print(f"Received action: {action}")

            await dispatch_action(action.type, manager, ws, state, action.data)
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.get("/proxy")
async def proxy_image(url: str = Query(..., description="URL to proxy")):
    """Proxy endpoint for cover art and images from Sonos devices"""    
    try:
        if not url.startswith(("http://", "https://")):
            raise Exception("Invalid URL scheme")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Get content type from the response
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
        file_path = "./assets/empty.png"

        with open(file_path, "rb") as f:
            content = f.read()
            content_type = "image/png"  
            return Response(
                    content=content,
                    media_type=content_type,
                    headers={
                        "Cache-Control": "public, max-age=3600",
                        "Access-Control-Allow-Origin": "*"
                    }
                )

@app.get("/")
async def root():
    return FileResponse('index.html')