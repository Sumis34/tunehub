from typing import List, Optional, Any
import asyncio
from fastapi import WebSocket
from soco import SoCo
from connection import ConnectionManager, Event
from sonos import Favorite, is_playing
from enum import Enum

class EventTypes(Enum):
    VOLUME = "volume"
    DEVICES = "devices"
    ACTIVE_DEVICE = "active-device"
    FAVORITES = "favorites"
    PLAYBACK_STATE = "playback-state"
    WIFI_NETWORKS = "wifi-networks"
    WIFI_STATUS = "wifi-status"
    WIFI_RESULT = "wifi-result"

class StateManager:
    def __init__(self, cm: ConnectionManager):
        self._volume: int = 50
        self._devices: List[SoCo] = []
        self._active_device: Optional[SoCo] = None
        self._favorites: List[Favorite] = []
        self._track_info: dict = {"title": None, "artist": None, "album_art": None}
        self._connection_manager: ConnectionManager = cm
        self._playback_state = ""
        self._wifi_networks: List[dict] = []
        self._wifi_status: dict = {
            "connected": False,
            "ssid": None,
            "device": None,
            "ip": "10.42.0.1",
            "signal": None,
            "mode": "ap",
            "apSsid": "TuneHub-Setup",
            "manageUrl": "http://10.42.0.1:8000/config/wifi",
        }
        self._wifi_result: dict = {
            "ok": True,
            "action": None,
            "message": "",
        }
        self.event_names = EventTypes

    @property
    def volume(self) -> int:
        """Get volume"""
        return self._volume

    @volume.setter
    def volume(self, value: int):
        """Set volume and auto-sync"""
        self._volume = value
        self._trigger_sync(self.event_names.VOLUME.value, self.sync_volume)

    @property
    def devices(self) -> List[Any]:
        """Get devices"""
        return self._devices

    @devices.setter
    def devices(self, value: List[Any]):
        """Set devices and auto-sync"""
        self._devices = value
        self._trigger_sync(self.event_names.DEVICES.value, self.sync_devices)

    @property
    def active_device(self) -> Optional[SoCo]:
        """Get active device"""
        return self._active_device

    @active_device.setter
    def active_device(self, value: Optional[SoCo]):
        """Set active device and auto-sync"""
        self._active_device = value
        self._trigger_sync(self.event_names.ACTIVE_DEVICE.value, self.sync_active_device)

    @property
    def favorites(self) -> List[Favorite]:
        """Get favorites"""
        return self._favorites

    @favorites.setter
    def favorites(self, value: List[Favorite]):
        """Set favorites and auto-sync"""
        self._favorites = value
        self._trigger_sync(self.event_names.FAVORITES.value, self.sync_favorites)

    @property
    def track_info(self) -> dict:
        """Get current track info"""
        return self._track_info

    @track_info.setter
    def track_info(self, value: dict):
        """Set track info and auto-sync"""
        self._track_info = value
        self._trigger_sync("play", self.sync_track_info)
    
    @property
    def playback_state(self) -> str:
        return self._playback_state
    @playback_state.setter
    def playback_state(self, value: str):
        self._playback_state = value
        self._trigger_sync(self.event_names.PLAYBACK_STATE.value, self.sync_playback_state)

    @property
    def wifi_networks(self) -> List[dict]:
        return self._wifi_networks

    @wifi_networks.setter
    def wifi_networks(self, value: List[dict]):
        self._wifi_networks = value
        self._trigger_sync(self.event_names.WIFI_NETWORKS.value, self.sync_wifi_networks)

    @property
    def wifi_status(self) -> dict:
        return self._wifi_status

    @wifi_status.setter
    def wifi_status(self, value: dict):
        self._wifi_status = value
        self._trigger_sync(self.event_names.WIFI_STATUS.value, self.sync_wifi_status)

    @property
    def wifi_result(self) -> dict:
        return self._wifi_result

    @wifi_result.setter
    def wifi_result(self, value: dict):
        self._wifi_result = value
        self._trigger_sync(self.event_names.WIFI_RESULT.value, self.sync_wifi_result)
    
    async def sync_playback_state(self):
        data = {
            "isPlaying": self.playback_state == "PLAYING",
        }
        if self._connection_manager:
            await self._connection_manager.broadcast(
                Event(type=self.event_names.PLAYBACK_STATE.value, data=data)
            )

    async def sync_wifi_networks(self):
        if self._connection_manager:
            await self._connection_manager.broadcast(
                Event(type=self.event_names.WIFI_NETWORKS.value, data=self._wifi_networks)
            )

    async def sync_wifi_status(self):
        if self._connection_manager:
            await self._connection_manager.broadcast(
                Event(type=self.event_names.WIFI_STATUS.value, data=self._wifi_status)
            )

    async def sync_wifi_result(self):
        if self._connection_manager:
            await self._connection_manager.broadcast(
                Event(type=self.event_names.WIFI_RESULT.value, data=self._wifi_result)
            )

    def _trigger_sync(self, key: str, sync_func):
        """Trigger async sync immediately if connection manager exists."""
        if not self._connection_manager:
            return

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(sync_func())
        except RuntimeError:
            # No event loop running; skip auto sync
            pass

    async def sync_volume(self):
        """Sync volume state to all clients"""
        if self._connection_manager:
            await self._connection_manager.broadcast(
                Event(type="volume", data=self._volume)
            )

    async def sync_devices(self):
        """Sync devices state to all clients"""
        if self._connection_manager:
            device_names = [device.player_name for device in self._devices]
            await self._connection_manager.broadcast(
                Event(type="devices", data=device_names)
            )

    async def sync_active_device(self):
        """Sync active device state to all clients"""
        if self._connection_manager:
            data = {
                "device_name": self._active_device.player_name if self._active_device else None
            }
            await self._connection_manager.broadcast(
                Event(type=self.event_names.ACTIVE_DEVICE.value, data=data)
            )

    async def sync_favorites(self):
        """Sync favorites state to all clients"""
        if self._connection_manager:
            favorites_data = [
                (fav.get("title"), fav.get("id"), fav.get("description"), fav.get("album_art")) for fav in self._favorites
            ]
            await self._connection_manager.broadcast(
                Event(type=self.event_names.FAVORITES.value, data=favorites_data)
            )

    async def sync_track_info(self):
        """Sync current track info to all clients"""
        if self._connection_manager:
            await self._connection_manager.broadcast(
                Event(type="play", data={"track_info": self._track_info})
            )

    async def sync_all(self):
        """Sync all state values to all clients"""
        await self.sync_volume()
        await self.sync_devices()
        await self.sync_active_device()
        await self.sync_favorites()
        await self.sync_track_info()
        await self.sync_playback_state()
        await self.sync_wifi_networks()
        await self.sync_wifi_status()
        await self.sync_wifi_result()
