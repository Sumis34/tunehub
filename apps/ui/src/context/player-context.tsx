import { createContext } from "react";

export type TrackInfo = {
  title: string | null;
  artist: string | null;
  album_art: string | null;
};

export type WifiNetwork = {
  ssid: string;
  signal: number;
  secured: boolean;
  security: string;
  active: boolean;
  saved: boolean;
};

export type WifiStatus = {
  connected: boolean;
  ssid: string | null;
  device: string | null;
  ip: string | null;
  signal: number | null;
  mode: "station" | "ap";
  apSsid: string;
  manageUrl: string;
};

export type WifiResult = {
  ok: boolean;
  action?: string | null;
  message: string;
};

export type PlayerContextValue = {
  volume: number;
  devices: string[];
  activeDevice?: { device_name: string };
  favorites: Array<[string, string, string, string]>;
  playbackState: { isPlaying: boolean };
  lastEventTime: Date;
  currentTrack: {
    favorite_id?: string;
    track_info?: TrackInfo;
  };
  wifiNetworks: WifiNetwork[];
  wifiStatus: WifiStatus;
  wifiResult?: WifiResult;
  changeActiveDevice: (deviceName: string) => void;
  togglePlaybackState: () => void;
  play: ({ favorite_id }: { favorite_id: string }) => void;
  changeVolume: (volume: number) => void;
  scanWifi: () => void;
  refreshWifiStatus: () => void;
  connectWifi: (ssid: string, password?: string) => void;
  disconnectWifi: () => void;
  forgetWifi: (ssid: string) => void;
};

export const PlayerContext = createContext<PlayerContextValue | null>(null);
