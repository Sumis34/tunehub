import asyncio
import struct

try:
    from smbus2 import SMBus
except ImportError:
    SMBus = None

# Matches ESP32 struct: int16_t delta, uint8_t button
STRUCT_FORMAT = '<hB'
STRUCT_SIZE = struct.calcsize(STRUCT_FORMAT)  # 3 bytes


class DialData:
    def __init__(self, delta: int, button: bool):
        self.delta = delta
        self.button = button

class Dial:
    """Reads rotary delta and button state over I2C via a packed struct."""

    def __init__(self, bus_num: int, address: int, poll_interval: float = 0.05):
        if SMBus is None:
            raise ImportError("smbus2 is not available")

        self.bus = SMBus(bus_num)
        self.address = address
        self.poll_interval = poll_interval
        self._callbacks = []

    def read(self) -> DialData | None:
        try:
            raw = self.bus.read_i2c_block_data(self.address, 0, STRUCT_SIZE)
            delta, button = struct.unpack(STRUCT_FORMAT, bytes(raw))
            return DialData(delta=delta, button=bool(button))
        except OSError:
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