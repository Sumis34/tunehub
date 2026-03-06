import { createFileRoute } from "@tanstack/react-router";
import { usePlayer } from "../../hooks/use-player";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { stopServer, lastEventTime, isConnected } = usePlayer();

  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastEventTime]);

  return (
    <div className="grid grid-cols-2 flex-1 text-neutral-100 p-5 gap-5">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-xl text-neutral-400">
          Configure your TuneHub experience.
        </p>
      </div>
      <ul className="divide-neutral-800 gap-3 flex flex-col">
        <button
          onClick={() => {
            stopServer();
          }}
          className="py-4 px-6 flex items-center gap-1 bg-neutral-900 active:bg-neutral-800 text-neutral-100 text-2xl transition-all w-full text-left rounded-2xl"
        >
          Stop Server
        </button>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="py-4 px-6 flex items-center gap-1 bg-neutral-900 active:bg-neutral-800 text-neutral-100 text-2xl transition-all w-full text-left rounded-2xl"
        >
          Restart Client
        </button>
        <p className="text-xl text-neutral-400">
          Last event received{" "}
          {Math.floor((time - lastEventTime.getTime()) / 1000)}s ago
        </p>
        <p className="text-xl text-neutral-400">
          {isConnected ? "Connected to server" : "Not connected to server"}
        </p>
      </ul>
    </div>
  );
}
