"""Action handlers for WebSocket events"""
from state import StateManager
from connection import ConnectionManager, Event
from sonos import play_favorite

async def handle_active_device(manager: ConnectionManager, ws, state: StateManager, data: dict):
    """Handle active device selection"""
    device_name = data.get("device_name")
    matching_device = next(
        (d for d in state.devices if d.player_name == device_name), None
    )
    if matching_device:
        state.active_device = matching_device  # Auto-syncs to all clients
    else:
        await manager.send_event(
            Event(type="error", data={"message": "Device not found"}), ws
        )


async def handle_play(manager: ConnectionManager, ws, state: StateManager, data: dict):
    """Handle play favorite action"""
    favorite_id = data.get("favorite_id")

    if state.active_device and favorite_id:
        favorite = next(
            (fav for fav in state.favorites if fav["id"] == favorite_id), None
        )
        if not favorite:
            await manager.send_event(
                Event(type="error", data={"message": "Favorite not found"}), ws
            )
            return

        try:
            play_favorite(state.active_device, favorite)
            info = state.active_device.get_current_track_info()
            await manager.send_event(
                Event(
                    type="play",
                    data={"favorite_id": favorite_id, "track_info": info},
                ),
                ws,
            )
        except Exception as e:
            await manager.send_event(
                Event(type="error", data={"message": f"Playback error: {str(e)}"}), ws
            )
    else:
        await manager.send_event(
            Event(type="error", data={"message": "No active device or favorite ID"}), ws
        )

async def handle_volume(manager: ConnectionManager, ws, state: StateManager, data: dict):
    """Handle volume adjustment"""
    new_volume = data.get("volume")
    if isinstance(new_volume, int) and 0 <= new_volume <= 100:
        state.volume = new_volume  # Auto-syncs to all clients
    else:
        await manager.send_event(
            Event(type="error", data={"message": "Invalid volume"}), ws
        )


async def dispatch_action(
    action_type: str,
    manager: ConnectionManager,
    ws,
    state: StateManager,
    data: dict,
):
    """Dispatch action to appropriate handler using match-case"""
    match action_type:
        case "active-device":
            await handle_active_device(manager, ws, state, data)
        case "play":
            await handle_play(manager, ws, state, data)
        case "volume":
            await handle_volume(manager, ws, state, data)
        case _:
            await manager.send_event(
                Event(type="error", data={"message": "Unknown action"}), ws
            )
