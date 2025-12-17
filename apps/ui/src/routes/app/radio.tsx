import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ColorThief from "colorthief";
import { useEvent } from "../../hooks/use-event";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "localhost:8000";

export const Route = createFileRoute("/app/radio")({
  component: RouteComponent,
});

const title = "Radio TuneHub";
const description = "80s Hits";

function RouteComponent() {
  const [dominantColorValues, setDominantColorValues] = useState<
    number[] | null
  >(null);
  const [favorites] = useEvent<Array<[string, string]>>("favorites", []);
  const [playing, play] = useEvent<{
    favorite_id: string;
    track_info?: Record<string, string>;
  }>("play", { favorite_id: "", track_info: {} });

  console.log({ favorites });

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const colorThief = new ColorThief();
    if (!imgRef.current?.complete) {
      return;
    }
    const c = colorThief.getColor(imgRef.current);
    setDominantColorValues(c);
  }, [imgRef]);

  // const [volume, setVolume, readyState] = useEvent("volume");

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: "Connecting",
  //   [ReadyState.OPEN]: "Open",
  //   [ReadyState.CLOSING]: "Closing",
  //   [ReadyState.CLOSED]: "Closed",
  //   [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  // }[readyState];

  const coverArt = `${API_BASE}/proxy?url=${encodeURIComponent(playing.track_info?.album_art || "")}`

  const gradient = `linear-gradient(180deg, rgba(${dominantColorValues?.slice(0, 3).join(",")}, 1) 0%, rgba(${dominantColorValues?.slice(0, 3).join(",")}, 0) 100%)`;
  const shadow = `0px 0px 50px 10px rgba(${dominantColorValues?.slice(0, 3).join(",")},0.5)`;

  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="flex justify-center text-white flex-col grow relative bg-neutral-950 rounded-xl overflow-hidden">
        <div className="z-10 flex justify-between">
          <div className="grid grid-cols-1 grid-rows-3 gap-10 w-24">
            {favorites.slice(0, 3).map(([name, id]) => (
              <button
                onClick={() => {
                  play({
                    favorite_id: id,
                    track_info: playing.track_info,
                  });
                }}
                key={id}
                className="bg-neutral-900 px-5 py-4 rounded-r-lg active:bg-neutral-800 truncate font-medium text-white/80 transition-all border-2 border-neutral-800"
              >
                {name}
              </button>
            ))}
          </div>
          <div>
            <img
              ref={imgRef}
              src={coverArt}
              // src="https://i.ebayimg.com/images/g/pVkAAOSwKmZhoXM7/s-l1200.jpg"
              alt="cover art"
              className="rounded-md w-60 aspect-square"
              crossOrigin="anonymous"
              style={{
                boxShadow: shadow,
              }}
            />
            <div className="mt-4 text-center">
              <h1 className="text-4xl font-bold">{playing.track_info?.title}</h1>
              <h2 className="text-3xl text-white/50">{description}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 grid-rows-3 gap-10 w-24">
            {favorites.slice(3, 6).map(([name, id]) => (
              <button
                key={id}
                onClick={() => {
                  play({
                    favorite_id: id,
                    track_info: playing.track_info,
                  });
                }}
                className="bg-neutral-900 px-5 py-4 rounded-l-lg active:bg-neutral-800 truncate font-medium text-white/80 transition-all border-2 border-neutral-800"
              >
                {name}
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
