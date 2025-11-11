import { useState, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

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
export function useEvent<T = unknown>(
  eventName: string,
  initialValue?: T
): [T, (value: T) => void, ReadyState] {
  const [state, setState] = useState<T>(initialValue as T);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<SocketEvent<T>>(SOCKET_URL, {
    share: true,
    shouldReconnect: () => true,
  });

  // Listen for messages with matching type
  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage.type === eventName) {
      setState(lastJsonMessage.data);
    }
  }, [lastJsonMessage, eventName]);

  // Send updates to the server
  const setEventState = useCallback(
    (value: T) => {
      setState(value);
      sendJsonMessage({ type: eventName, data: value });
    },
    [eventName, sendJsonMessage]
  );

  return [state, setEventState, readyState];
}
