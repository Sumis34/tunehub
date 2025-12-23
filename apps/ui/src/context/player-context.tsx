import { createContext } from "react";

export type TrackInfo = {
  title: string | null;
  artist: string | null;
  album_art: string | null;
};

export type PlayerContextValue = {
  volume: number;
  devices: string[];
  activeDevice: { device_name: string | null };
  favorites: Array<[string, string, string, string]>;
  playbackState: { paused: boolean };
  lastEventTime: Date;
  currentTrack: {
    favorite_id?: string;
    track_info?: TrackInfo;
  };
  changeActiveDevice: (deviceName: string) => void;
  togglePlaybackState: () => void;
  play: ({ favorite_id }: { favorite_id: string }) => void;
  changeVolume: (volume: number) => void;
};

export const PlayerContext = createContext<PlayerContextValue | null>(null);
