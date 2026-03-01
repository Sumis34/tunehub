import { useState, useCallback, useEffect } from "react";
import { PlayerContext, type PlayerContextValue } from "./player-context";
import useWebSocket from "react-use-websocket";
import { useDebouncedCallback } from "../hooks/use-debounce";

const SOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`
    : "ws://localhost:8000/ws");

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
  const [wifiNetworks, setWifiNetworks] = useState<
    PlayerContextValue["wifiNetworks"]
  >([]);
  const [wifiStatus, setWifiStatus] = useState<PlayerContextValue["wifiStatus"]>(
    {
      connected: false,
      ssid: null,
      device: null,
      ip: "10.42.0.1",
      signal: null,
      mode: "ap",
      apSsid: "TuneHub-Setup",
      manageUrl: "http://10.42.0.1:8000/config/wifi",
    }
  );
  const [wifiResult, setWifiResult] = useState<PlayerContextValue["wifiResult"]>();

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
      case "wifi-networks":
        setWifiNetworks(lastJsonMessage.data as PlayerContextValue["wifiNetworks"]);
        break;
      case "wifi-status":
        setWifiStatus(lastJsonMessage.data as PlayerContextValue["wifiStatus"]);
        break;
      case "wifi-result":
        setWifiResult(lastJsonMessage.data as PlayerContextValue["wifiResult"]);
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

  const scanWifi = useCallback(() => {
    sendJsonMessage({ type: "wifi-scan", data: {} });
  }, [sendJsonMessage]);

  const refreshWifiStatus = useCallback(() => {
    sendJsonMessage({ type: "wifi-status", data: {} });
  }, [sendJsonMessage]);

  const connectWifi = useCallback(
    (ssid: string, password?: string) => {
      sendJsonMessage({
        type: "wifi-connect",
        data: {
          ssid,
          password,
        },
      });
    },
    [sendJsonMessage]
  );

  const disconnectWifi = useCallback(() => {
    sendJsonMessage({ type: "wifi-disconnect", data: {} });
  }, [sendJsonMessage]);

  const forgetWifi = useCallback(
    (ssid: string) => {
      sendJsonMessage({
        type: "wifi-forget",
        data: {
          ssid,
        },
      });
    },
    [sendJsonMessage]
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
        wifiNetworks,
        wifiStatus,
        wifiResult,
        changeActiveDevice,
        changeVolume,
        togglePlaybackState,
        play,
        scanWifi,
        refreshWifiStatus,
        connectWifi,
        disconnectWifi,
        forgetWifi,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
