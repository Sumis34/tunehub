import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ColorThief from "colorthief";
import { LucidePause, LucidePlay } from "lucide-react";
import { usePlayer } from "../../hooks/use-player";
import NoDeviceSelected from "../../context/no-deivce-selected";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "localhost:8000";

export const Route = createFileRoute("/app/radio")({
  component: RouteComponent,
});

function RouteComponent() {
  const [dominantColorValues, setDominantColorValues] = useState<
    number[] | null
  >(null);

  const {
    favorites,
    currentTrack,
    play,
    playbackState,
    togglePlaybackState,
    activeDevice,
  } = usePlayer();

  const imgRef = useRef<HTMLImageElement>(null);
  const coverArt = `${API_BASE}/proxy?url=${encodeURIComponent(currentTrack.track_info?.album_art || "")}`;

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

  const title = currentTrack.track_info?.title ?? "Unknown Track";
  const artist = currentTrack.track_info?.artist ?? "Unknown Artist";

  if (!activeDevice) {
    return <NoDeviceSelected />;
  }

  return (
    <div className="flex-1 min-h-0 p-1 flex flex-col">
      <div className="grid grid-rows-1 grid-cols-3 flex-1 grow gap-1 min-h-0">
        <div
          className="col-span-2 flex items-center justify-center rounded-lg transition-colors"
          style={{
            background: dominantColorValues ? bgColor : "transparent",
          }}
        >
          <img
            ref={imgRef}
            src={coverArt}
            // src="https://marketplace.canva.com/EAGl2RBdUF0/1/0/1600w/canva-dark-blue-and-white-modern-lost-in-stars-album-cover-LkSUXx1d-Sw.jpg"
            // src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=360/uploads/users/114/posts/34296/final_image/Final-image.jpg"
            alt="cover art"
            className="rounded-md h-72 aspect-square"
            crossOrigin="anonymous"
            onLoad={extractColor}
            onError={() => setDominantColorValues([64, 64, 64])}
            style={{
              boxShadow: shadow,
            }}
          />
        </div>
        <div className="col-span-1 bg-neutral-900 rounded-lg overflow-y-auto mask-exclude masked-overflow no-scrollbar">
          <div className="divide-neutral-800 divide-y">
            {favorites.map(([name, id, desc]) => (
              <button
                onClick={() => {
                  play({
                    favorite_id: id,
                  });
                }}
                key={id}
                className="px-2 py-4 active:bg-neutral-800 text-neutral-100 truncate transition-all w-full text-left"
              >
                <div className="truncate text-xl">{name}</div>
                <span className="text-lg text-neutral-500">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-rows-1 grid-cols-3 gap-1 h-21">
        <div className="col-span-2 p-2">
          <h1 className="text-3xl text-neutral-100 truncate">{title}</h1>
          <h2 className="text-2xl text-neutral-500">{artist}</h2>
        </div>
        <div className="col-span-1 flex items-center justify-start">
          <button
            onClick={() => togglePlaybackState()}
            className="bg-neutral-100 rounded-full p-3 active:scale-95 transition-transform"
          >
            {playbackState && playbackState.isPlaying ? (
              <LucidePause className="fill-neutral-900 size-8" />
            ) : (
              <LucidePlay className="fill-neutral-900 size-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
