import asyncio
import struct
try: 
    from smbus2 import SMBus
except ImportError:
    SMBus = None
class Dial:
    """Reads relative rotary movement over I2C and allows registering callbacks for new deltas."""

    def __init__(self, bus_num: int, address: int, poll_interval: float = 0.05):
        if SMBus is None:
            raise ImportError("Failed to import smbus2. (Windows has no support for smbus2)")

        self.bus_num = bus_num
        self.address = address
        self.poll_interval = poll_interval
        self.bus = SMBus(bus_num)
        self._callbacks = []

    async def _poll_loop(self):
        while True:
            delta = self.read_delta()
            if delta != 0:
                for cb in self._callbacks:
                    cb(delta)
            await asyncio.sleep(self.poll_interval)

    def read_delta(self) -> int:
        try:
            data = self.bus.read_i2c_block_data(self.address, 0, 2)
            return struct.unpack('<h', bytes(data))[0]
        except OSError:
            return 0

    def register_callback(self, callback):
        if callable(callback):
            self._callbacks.append(callback)

    async def start(self):
        await self._poll_loop()