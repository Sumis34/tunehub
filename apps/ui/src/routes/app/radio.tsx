import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LucidePause, LucidePlay } from "lucide-react";
import { usePlayer } from "../../hooks/use-player";
import NoDeviceSelected from "../../context/no-deivce-selected";
import { useQuickMenu } from "../../hooks/use-quick-menu";
import { Next, Previous } from "../../components/icons";
import Carousel from "../../components/carousel";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
    volume,
    skipBackward,
    skipForward,
    queue,
  } = usePlayer();

  console.log(currentTrack);

  const prevVolume = useRef(volume);
  const navigate = useNavigate();

  const menu = useQuickMenu();

  useEffect(() => {
    if (volume !== prevVolume.current) {
      menu.open();
      menu.clearInteraction();
      menu.closeAfter(2000);
    }
    prevVolume.current = volume;
  }, [volume, menu]);

  const shadow = `0px 0px 50px 10px rgba(${dominantColorValues?.slice(0, 3).join(",")},0.3)`;
  const bgColor = `rgba(${dominantColorValues?.join(",")})`;

  const title =
    currentTrack.track_info?.title &&
    currentTrack.track_info.title.trim() !== ""
      ? currentTrack.track_info.title
      : "Unknown Track";

  const artist =
    currentTrack.track_info?.artist &&
    currentTrack.track_info.artist.trim() !== ""
      ? currentTrack.track_info.artist
      : "Unknown Artist";

  const onIndexChange = useCallback((index: number, color: number[] | null) => {
    setDominantColorValues(color);
    play({
      queue_index: index,
    });
  }, [play]);

  if (!activeDevice?.device_name) {
    return <NoDeviceSelected />;
  }

  return (
    <div className="flex-1 min-h-0 p-1 flex flex-col">
      <div className="grid grid-rows-1 grid-cols-3 flex-1 grow gap-1 min-h-0">
        <div
          className="col-span-2 flex items-center justify-center rounded-lg transition-colors relative duration-300"
          style={{
            background: dominantColorValues ? bgColor : "transparent",
            boxShadow: shadow,
          }}
        >
          <div className="absolute top-0 left-0 p-3 z-10 flex items-start justify-start">
            <button
              onClick={() => navigate({ to: "/app/select-device" })}
              className="rounded-full bg-neutral-500/30 px-2 py-1 font-semibold text-neutral-100"
            >
              {activeDevice.device_name}
            </button>
          </div>
          <Carousel
            onIndexChange={(index, color) => onIndexChange(index, color)}
            items={queue.map((item) => ({
              image: `${API_BASE}/proxy?url=${encodeURIComponent(item?.album_art || "")}`,
              alt: `${item?.title} - ${item?.artist}`,
            }))}
            // TODO: not working with non queue tracks (e.g. radio mode)
            activeIndex={
              currentTrack.track_info?.queue_index
                ? currentTrack.track_info.queue_index - 1
                : 0
            }
          />
        </div>
        <div className="col-span-1 bg-neutral-900 rounded-lg overflow-y-auto mask-exclude masked-overflow no-scrollbar">
          <div className="">
            {favorites.map(([name, id, desc]) => (
              <button
                onClick={() => {
                  play({
                    favorite_id: id,
                  });
                }}
                key={id}
                className="px-2 py-4 active:bg-neutral-800 text-neutral-100 transition-all w-full text-left"
              >
                <div className="truncate text-xl">{name}</div>
                <div className="text-lg text-neutral-500 truncate">{desc}</div>
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
        <div className="col-span-1 flex items-center justify-around">
          <div className="flex gap-1">
            <button
              onClick={() => skipBackward()}
              disabled={currentTrack.track_info?.actions?.previous === false}
              className="disabled:opacity-20 px-3 py-3"
            >
              <Previous className="fill-neutral-500 stroke-neutral-500 size-6" />
            </button>
            <button
              onClick={() => togglePlaybackState()}
              className="group px-3 py-3"
              disabled={currentTrack.track_info?.actions?.play === false}
            >
              <div className="bg-neutral-100 rounded-full p-3 group-active:scale-95 transition-transform">
                {playbackState && playbackState.isPlaying ? (
                  <LucidePause className="fill-neutral-900 size-8" />
                ) : (
                  <LucidePlay className="fill-neutral-900 size-8" />
                )}
              </div>
            </button>
            <button
              onClick={() => skipForward()}
              disabled={currentTrack.track_info?.actions?.next === false}
              className="disabled:opacity-20 px-3 py-3"
            >
              <Next className="fill-neutral-500 stroke-neutral-500 size-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
