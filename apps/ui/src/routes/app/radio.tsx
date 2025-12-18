import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ColorThief from "colorthief";
import { useEvent } from "../../hooks/use-event";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "localhost:8000";

export const Route = createFileRoute("/app/radio")({
  component: RouteComponent,
});

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
  const coverArt = `${API_BASE}/proxy?url=${encodeURIComponent(playing.track_info?.album_art || "")}`;

  const extractColor = () => {
    if (!imgRef.current) return;

    try {
      const colorThief = new ColorThief();

      if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        const color = colorThief.getColor(imgRef.current);
        if (color && color.length === 3) {
          setDominantColorValues(color);
        }
      }
    } catch (error) {
      console.error("Failed to extract color:", error);
      setDominantColorValues([64, 64, 64]);
    }
  };

  // const [volume, setVolume, readyState] = useEvent("volume");

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: "Connecting",
  //   [ReadyState.OPEN]: "Open",
  //   [ReadyState.CLOSING]: "Closing",
  //   [ReadyState.CLOSED]: "Closed",
  //   [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  // }[readyState];

  // const gradient = `linear-gradient(180deg, rgba(${dominantColorValues?.slice(0, 3).join(",")}, 1) 0%, rgba(${dominantColorValues?.slice(0, 3).join(",")}, 0) 100%)`;
  const shadow = `0px 0px 50px 10px rgba(${dominantColorValues?.slice(0, 3).join(",")},0.5)`;
  const bgColor = `rgba(${dominantColorValues?.join(",")})`;

  const title = playing.track_info?.title ?? "Unknown Track";
  const artist = playing.track_info?.artist ?? "Unknown Artist";

  return (
    <div className="h-full w-full p-1 flex flex-col bg-neutral-900">
      <div className="grid grid-rows-1 grid-cols-4 flex-1 grow">
        <div
          className="col-span-3 flex items-center justify-center rounded-lg"
          style={{
            background: dominantColorValues ? bgColor : "transparent",
          }}
        >
          <img
            ref={imgRef}
            // src={coverArt}
            src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=360/uploads/users/114/posts/34296/final_image/Final-image.jpg"
            alt="cover art"
            className="rounded-md aspect-square"
            crossOrigin="anonymous"
            onLoad={extractColor}
            onError={() => setDominantColorValues([64, 64, 64])}
            style={{
              boxShadow: shadow,
            }}
          />
        </div>
        <div className="col-span-1">
          {favorites.map(([name, id]) => (
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
      </div>
      <div className="grid grid-rows-1 grid-cols-4">
        <div className="col-span-3 p-2">
          <h1 className="text-3xl text-white">{title}</h1>
          <h2 className="text-2xl text-white/50">{artist}</h2>
        </div>
        <div className="col-span-1"></div>
      </div>
    </div>
  );
}
