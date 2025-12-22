import { useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useEventContext } from "./use-event-context";
import type { EventPayloads } from "../context/event-context";

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000/ws";

export interface SocketEvent<T = unknown> {
  type: string;
  data: T;
}

/**
 * useEvent — syncs local state with remote websocket events.
 *
 * @param eventName Event type identifier.
 * @param initialValue Optional initial local state.
 * @returns [state, setEventState, connectionStatus]
 */
// Typed overload for known events
export function useEvent<K extends keyof EventPayloads>(
  eventName: K,
  initialValue?: EventPayloads[K]
): [EventPayloads[K], (value: EventPayloads[K]) => void, ReadyState];

// Generic fallback overload
export function useEvent<T = unknown>(
  eventName: string,
  initialValue?: T
): [T, (value: T) => void, ReadyState];

export function useEvent<T = unknown>(
  eventName: string,
  initialValue?: T
): [T, (value: T) => void, ReadyState] {
  const { state: ctxState, setEvent, setLastEventTime } = useEventContext();

  // Read directly from context; initialize on first render if not present
  const state = (ctxState[eventName] as T | undefined) ?? (initialValue as T);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<SocketEvent<T>>(SOCKET_URL, {
    share: true,
    shouldReconnect: () => true,
  });

  // Listen for messages with matching type and persist into context
  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage.type === eventName) {
      const next = lastJsonMessage.data as T;
      setLastEventTime(new Date());
      setEvent(eventName as keyof EventPayloads, next as EventPayloads[keyof EventPayloads]);
    }
  }, [lastJsonMessage, eventName, setEvent]);

  // Initialize context with default value if not present
  useEffect(() => {
    if (initialValue !== undefined && ctxState[eventName] === undefined) {
      setEvent(eventName as keyof EventPayloads, initialValue as EventPayloads[keyof EventPayloads]);
    }
  }, [eventName, initialValue, ctxState, setEvent]);

  // Send updates to the server and context
  const setEventState = useCallback(
    (value: T) => {
      setEvent(eventName as keyof EventPayloads, value as EventPayloads[keyof EventPayloads]);
      sendJsonMessage({ type: eventName, data: value });
    },
    [eventName, sendJsonMessage, setEvent]
  );

  return [state, setEventState, readyState];
}
