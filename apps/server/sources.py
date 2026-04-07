from config import Config
from sonos import Favorite
from typing import List


def get_tunehub_sources() -> List[Favorite]:
  config = Config()
  sources: List[Favorite] = config.native_sources
  return sources