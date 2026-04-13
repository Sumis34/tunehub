import asyncio
import struct

try:
    from smbus2 import SMBus
except ImportError:
    SMBus = None
    
import logging
 
logger = logging.getLogger(__name__)

# Matches ESP32 struct: int16_t delta, uint8_t button
STRUCT_FORMAT = '<hB'
STRUCT_SIZE = struct.calcsize(STRUCT_FORMAT)  # 3 bytes
MAX_DELTA = 5


class DialData:
    def __init__(self, delta: int, button: bool):
        self.delta = delta
        self.button = button

class Dial:
    """Reads rotary delta and button state over I2C via a packed struct."""

    def __init__(self, bus_num: int, address: int, poll_interval: float = 0.05, sensitivity: int = 1):
        if SMBus is None:
            raise ImportError("smbus2 is not available")

        self.bus = SMBus(bus_num)
        self.address = address
        self.poll_interval = poll_interval
        self._callbacks = []
        self._connected = False
        self.sensitivity = sensitivity

    def read(self) -> DialData | None:
        try:
            raw = self.bus.read_i2c_block_data(self.address, 0, STRUCT_SIZE)
            delta, button = struct.unpack(STRUCT_FORMAT, bytes(raw))
            
            if delta not in range(-MAX_DELTA, MAX_DELTA + 1):
                logger.warning(f"Received delta {delta} exceeds max of {MAX_DELTA}, ignoring")
                return None
            
            if not self._connected:
                logger.info(f"Dial reconnected at {hex(self.address)}")
                self._connected = True
            
            return DialData(delta=delta * self.sensitivity, button=bool(button))
        except OSError as e:
            if self._connected:
                logger.warning(f"Dial lost at {hex(self.address)}: {e}")
                self._connected = False
            return None

    def register_callback(self, callback):
        if callable(callback):
            self._callbacks.append(callback)

    async def _poll_loop(self):
        while True:
            data = self.read()
            if data is not None and (data.delta != 0 or data.button):
                for cb in self._callbacks:
                    cb(data)
            await asyncio.sleep(self.poll_interval)

    async def start(self):
        await self._poll_loop()