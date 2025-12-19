"""Action handlers for WebSocket events"""
import logging
from state import StateManager
from connection import ConnectionManager, Event
from sonos import play_favorite, get_playable_favorites

logger = logging.getLogger(__name__)

async def handle_active_device(manager: ConnectionManager, ws, state: StateManager, data: dict):
    """Handle active device selection"""
    device_name = data.get("device_name")
    matching_device = next(
        (d for d in state.devices if d.player_name == device_name), None
    )
    if matching_device:
        state.active_device = matching_device  # Auto-syncs to all clients
        
        # Update favorites for the new active device
        try:
            state.favorites = get_playable_favorites(matching_device)
        except Exception as e:
            logger.error(f"Failed to get favorites for {device_name}: {e}")
        
        # Import here to avoid circular imports
        from main import _subscribe_to_device_events
        await _subscribe_to_device_events(matching_device)
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
        play_favorite(state.active_device, favorite)
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

async def handle_pause(manager: ConnectionManager, ws, state: StateManager, data: dict):
    """Handle pause action"""
    if state.active_device:
        info = state.active_device.get_current_transport_info()
        if info["current_transport_state"] == "PLAYING":
            return  state.active_device.pause()
        else:
            state.active_device.play()

    else:
        await manager.send_event(
            Event(type="error", data={"message": "No active device"}), ws
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
        case "pause":
            await handle_pause(manager, ws, state, data)
        case _:
            await manager.send_event(
                Event(type="error", data={"message": "Unknown action"}), ws
            )
