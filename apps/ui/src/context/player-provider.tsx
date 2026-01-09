import { useState, useCallback, useEffect } from "react";
import { PlayerContext, type PlayerContextValue } from "./player-context";
import useWebSocket from "react-use-websocket";
import { useDebouncedCallback } from "../hooks/use-debounce";

const SOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000/ws";

export interface SocketEvent<T = unknown> {
  type: string;
  data: T;
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolume] = useState<number>(50);
  const [devices, setDevices] = useState<string[]>([]);
  const [activeDevice, setActiveDevice] =
    useState<PlayerContextValue["activeDevice"]>();
  const [currentTrack, setCurrentTrack] = useState<
    PlayerContextValue["currentTrack"]
  >({
    favorite_id: undefined,
    track_info: undefined,
  });
  const [favorites, setFavorites] = useState<PlayerContextValue["favorites"]>(
    []
  );

  const [playbackState, setPlaybackState] = useState<
    PlayerContextValue["playbackState"]
  >({ isPlaying: false });

  const [lastEventTime, setLastEventTime] = useState<Date>(new Date());

  const { sendJsonMessage, lastJsonMessage } = useWebSocket<SocketEvent>(
    SOCKET_URL,
    {
      share: true,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (!lastJsonMessage) return;

    if (!Object.hasOwn(lastJsonMessage, "type")) return;
    if (!Object.hasOwn(lastJsonMessage, "data")) return;

    switch (lastJsonMessage.type) {
      case "volume":
        setVolume(lastJsonMessage.data as number);
        break;
      case "devices":
        setDevices(lastJsonMessage.data as string[]);
        break;
      case "active-device":
        setActiveDevice(
          lastJsonMessage.data as PlayerContextValue["activeDevice"]
        );
        break;
      case "play":
        setCurrentTrack(
          lastJsonMessage.data as PlayerContextValue["currentTrack"]
        );
        break;
      case "playback-state":
        setPlaybackState(
          lastJsonMessage.data as PlayerContextValue["playbackState"]
        );
        break;
      case "favorites":
        setFavorites(lastJsonMessage.data as PlayerContextValue["favorites"]);
        break;
      default:
        console.log("Unknown event: ", lastJsonMessage);
        break;
    }

    setLastEventTime(new Date());
  }, [lastJsonMessage]);

  const play = useCallback(
    ({ favorite_id }: { favorite_id: string }) => {
      sendJsonMessage({
        type: "play",
        data: {
          favorite_id: favorite_id,
        },
      });
    },
    [sendJsonMessage]
  );

  const togglePlaybackState = useCallback(() => {
    const newState = !playbackState.isPlaying;
    setPlaybackState({ isPlaying: newState });
    sendJsonMessage({ type: "playback-toggle", data: { isPlaying: newState } });
  }, [playbackState, sendJsonMessage]);

  const changeActiveDevice = useCallback(
    (deviceName: string) => {
      setActiveDevice({ device_name: deviceName });
      sendJsonMessage({
        type: "active-device",
        data: { device_name: deviceName },
      });
    },
    [sendJsonMessage]
  );

  const syncVolumeChange = useDebouncedCallback<[number]>((val) => {
    sendJsonMessage({
      type: "volume",
      data: {
        volume: val,
      },
    });
  }, 500);

  const changeVolume = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      syncVolumeChange(newVolume);
    },
    [setVolume, syncVolumeChange]
  );

  return (
    <PlayerContext.Provider
      value={{
        lastEventTime,
        volume,
        devices,
        activeDevice,
        favorites,
        currentTrack,
        playbackState,
        changeActiveDevice,
        changeVolume,
        togglePlaybackState,
        play,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
