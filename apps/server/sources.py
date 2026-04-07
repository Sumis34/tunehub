from config import Config
from sonos import Favorite
from typing import List
from soco import discover, SoCo
from sonos import get_playable_favorites

class Sources:
  include_sonos_favorites = True
  include_native_sources = True
  
  def __init__(self, zone: SoCo) -> None:
    self.zone = zone
  def _get_native_sources(self) -> List[Favorite]:
    config = Config()
    sources: List[Favorite] = config.native_sources
    return sources
  def get_sources(self) -> List[Favorite]:
    sources = []
    native = self._get_native_sources()
    sonos_favorites = get_playable_favorites(self.zone)
    
    if self.include_native_sources:
      sources.extend(native)
    if self.include_sonos_favorites:
      sources.extend(sonos_favorites)
    
    return sources