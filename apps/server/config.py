import tomllib
import logging
from sonos import Favorite
from typing import List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
class Config:
  paths = ["config.toml", "/etc/opt/tunehub/config.toml"]

  def __init__(self):
    data = self.load()
    
    self.dial_i2c_address = data.get("dial", {}).get("i2c_address")
    self.dial_i2c_bus = data.get("dial", {}).get("i2c_bus")
    self.native_sources: List[Favorite] = data.get("sources", {}).get("native", [])
  
  def load(self):
    for path in self.paths:
      try:
        logger.info(f"Attempting to load config from {path}...")
        with open(path, "rb") as f:
          data = tomllib.load(f)
          logger.info(f"Loaded config.toml from {path}.")
          return data
      except FileNotFoundError:
          logger.info(f"Config file not found at {path}.")
          pass
      
    if not data:
        raise ValueError("No valid config.toml found")
  