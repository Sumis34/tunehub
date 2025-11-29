import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ColorThief from "colorthief";

export const Route = createFileRoute("/app/radio")({
  component: RouteComponent,
});

const title = "Radio TuneHub";
const description = "80s Hits";

const favorites = [
  { name: "SRF 3", id: "srf3" },
  { name: "Radio Swiss Pop", id: "radioswisspop" },
  { name: "Radio Swiss Jazz", id: "radioswissjazz" },
  { name: "Radio Swiss Classic", id: "radioswissclassic" },
  { name: "Energy Zürich", id: "energyzuerich" },
];

function RouteComponent() {
  const [dominantColorValues, setDominantColorValues] = useState<
    number[] | null
  >(null);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const colorThief = new ColorThief();
    if (!imgRef.current?.complete) {
      return;
    }
    const c = colorThief.getColor(imgRef.current);
    setDominantColorValues(c);
  }, [imgRef]);

  // const [volume, setVolume, readyState] = useEvent("adjust-volume");

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: "Connecting",
  //   [ReadyState.OPEN]: "Open",
  //   [ReadyState.CLOSING]: "Closing",
  //   [ReadyState.CLOSED]: "Closed",
  //   [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  // }[readyState];

  const gradient = `linear-gradient(180deg, rgba(${dominantColorValues?.slice(0, 3).join(",")}, 1) 0%, rgba(${dominantColorValues?.slice(0, 3).join(",")}, 0) 100%)`;
  const shadow = `0px 0px 50px 10px rgba(${dominantColorValues?.slice(0, 3).join(",")},0.5)`;

  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="flex justify-center text-white flex-col grow relative bg-neutral-950 rounded-xl overflow-hidden">
        <div className="z-10 flex justify-between">
          <div className="grid grid-cols-1 grid-rows-3 gap-10 w-24">
            {favorites.slice(0, 3).map((favorite) => (
              <button
                onClick={() => {}}
                key={favorite.id}
                className="bg-neutral-900 px-5 py-4 rounded-r-lg active:bg-neutral-800 truncate font-medium text-white/80 transition-all border-2 border-neutral-800"
              >
                {favorite.name}
              </button>
            ))}
          </div>
          <div>
            <img
              ref={imgRef}
              src="https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/NirvanaNevermindalbumcover.jpg/250px-NirvanaNevermindalbumcover.jpg"
              // src="https://i.ebayimg.com/images/g/pVkAAOSwKmZhoXM7/s-l1200.jpg"
              alt="cover art"
              className="rounded-md w-60 aspect-square"
              crossOrigin="anonymous"
              style={{
                boxShadow: shadow,
              }}
            />
            <div className="mt-4 text-center">
              <h1 className="text-4xl font-bold">{title}</h1>
              <h2 className="text-3xl text-white/50">{description}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 grid-rows-3 gap-10 w-24">
            {favorites.slice(3, 6).map((favorite) => (
              <button
                key={favorite.id}
                className="bg-neutral-900 px-5 py-4 rounded-l-lg active:bg-neutral-800 truncate font-medium text-white/80 transition-all border-2 border-neutral-800"
              >
                {favorite.name}
              </button>
            ))}
          </div>
        </div>
        <div
          className="absolute inset-0 z-0"
          style={{
            background: dominantColorValues ? gradient : "transparent",
          }}
        ></div>
        <img
          src="/noiseTexture.png"
          className="absolute inset-0 mix-blend-multiply w-full h-full object-cover"
          alt="noise texture"
        />
      </div>
    </div>
  );
}
