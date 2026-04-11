import { createContext } from "react";

export type TrackInfo = {
  title: string | null;
  artist: string | null;
  album_art: string | null;
  actions?: {
    play: boolean;
    pause: boolean;
    stop: boolean;
    next: boolean;
    previous: boolean;
    set: boolean;
  };
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
  isConnected: boolean;
  changeActiveDevice: (deviceName: string) => void;
  togglePlaybackState: () => void;
  play: ({ favorite_id }: { favorite_id: string }) => void;
  changeVolume: (volume: number) => void;
  stopServer: () => void;
  scanDevices: () => void;
  skipForward: () => void;
  skipBackward: () => void;
};

export const PlayerContext = createContext<PlayerContextValue | null>(null);
