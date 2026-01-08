import { Speaker } from "lucide-react";
import { usePlayer } from "../hooks/use-player";

export default function NoDeviceSelected() {
  const { devices, changeActiveDevice } = usePlayer();

  return (
    <div className="grid grid-cols-2 flex-1 text-neutral-100 p-5 gap-5">
      <div>
        <h1 className="text-3xl font-bold">Where do you want to listen?</h1>
        <p className="text-xl text-neutral-400">
          Select a device from the list to start playing music.
        </p>
      </div>
      <div className="bg-neutral-900 rounded-lg p-5">
        {devices.length === 0 ? (
          <p className="text-neutral-500 text-xl text-center">
            No Sonos devices found in current network.
          </p>
        ) : (
          <ul className="divide-neutral-800 divide-y">
            {devices.map((device) => (
              <button
                onClick={() => changeActiveDevice(device)}
                key={device}
                className="py-4 px-2 flex items-center gap-1 active:bg-neutral-800 text-neutral-100 text-2xl transition-all w-full text-left rounded-2xl font-semibold"
              >
                <Speaker className="w-8 h-8" />
                {device}
              </button>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
