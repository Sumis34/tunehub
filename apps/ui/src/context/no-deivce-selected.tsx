import { usePlayer } from "../hooks/use-player";

export default function NoDeviceSelected() {
  const { devices } = usePlayer();

  return (
    <div className="grid grid-cols-2 flex-1 text-neutral-100 p-12">
      <div>
        <h1 className="text-3xl font-bold">Where do you want to listen?</h1>
        <p className="text-lg text-neutral-400">
          Select a device from the list to start playing music.
        </p>
      </div>
      <div className="bg-neutral-900 p-3 rounded-lg">
        {devices.length === 0 ? (
          <p className="text-neutral-500 text-center">
            No Sonos devices found in current network.
          </p>
        ) : (
          <ul className="list-disc list-inside">
            {devices.map((device) => (
              <li key={device}>{device}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
