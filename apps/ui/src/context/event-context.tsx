import { createContext } from "react";

export type TrackInfo = {
  title: string | null;
  artist: string | null;
  album_art: string | null;
};

export type EventPayloads = {
  volume: number;
  devices: string[];
  "active-device": { device_name: string | null };
  favorites: Array<[string, string, string, string]>;
  play: { favorite_id?: string; track_info?: TrackInfo };
  pause: { paused: boolean };
  // Allow future events while keeping type safety for known ones
  [key: string]: unknown;
};

export type EventContextValue = {
  state: Partial<EventPayloads>;
  setEvent: <K extends keyof EventPayloads>(key: K, value: EventPayloads[K]) => void;
};

export const EventContext = createContext<EventContextValue | null>(null);
