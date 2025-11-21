import { createFileRoute, Link } from "@tanstack/react-router";
import { MoveLeft, Speaker, Wifi } from "lucide-react";
import { Tabs } from "@base-ui-components/react/tabs";
import AudioBars from "../../components/AudioBars";
import { useEvent } from "../../hooks/use-event";
import type { Device } from "../../types";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [device, setDevice] = useEvent<Device>("target-device", {
    id: "default",
    name: "Küchen Radio",
  });

  const [devices] = useEvent<Device[]>("devices", [
    { id: "default", name: "Küchen Radio" },
    { id: "livingroom", name: "Wohnzimmer Speaker" },
    { id: "bedroom", name: "Schlafzimmer Speaker" },
  ]);

  const [isPlaying] = useEvent<boolean>("is-playing", false);

  return (
    <div className="h-full w-full bg-black flex flex-col">
      <Tabs.Root
        className="flex gap-2 grow"
        defaultValue="speaker"
        orientation="vertical"
      >
        <Tabs.List className="relative z-0 flex flex-col gap-2 border-r-2">
          <Tabs.Tab className="p-3 group" value="speaker">
            <Speaker className="stroke-white/70 w-12 h-12 group-data-selected:stroke-green-400 transition-all duration-200 ease-in-out" />
          </Tabs.Tab>
          <Tabs.Tab className="p-3 group" value="connections">
            <Wifi className="stroke-white/70 w-12 h-12 group-data-selected:stroke-green-400 transition-all duration-200 ease-in-out" />
          </Tabs.Tab>
          <Tabs.Indicator className="absolute left-0 z-[-1] h-(--active-tab-height) w-1 translate-y-(--active-tab-top) rounded-r-sm bg-green-400 transition-all duration-200 ease-in-out" />
        </Tabs.List>
        <div className="bg-neutral-900 rounded-tl-2xl grow p-5 overflow-y-auto">
          <Tabs.Panel className="text-white" value="speaker">
            <h1 className="text-2xl font-bold">Speaker</h1>
            <div className="w-full flex bg-neutral-800 rounded-md mt-5 p-5 gap-3 items-center">
              <AudioBars playing={isPlaying} />
              <p className="text-2xl font-semibold text-green-400">
                {device.name}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold mt-5 mb-2">
                Available Devices
              </h2>
              <div className="flex flex-col gap-3">
                {devices
                  .filter((d) => d.id !== device.id)
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDevice(d)}
                      className={`w-full text-left px-4 py-3 rounded-md font-medium bg-neutral-800 text-white flex gap-1 items-center fade`}
                    >
                      <Speaker className="w-6 h-6 mr-2" />
                      {d.name}
                    </button>
                  ))}
              </div>
            </div>
          </Tabs.Panel>
          <Tabs.Panel className="text-white" value="connections">
            <h1 className="text-2xl font-bold">Connections</h1>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
}
