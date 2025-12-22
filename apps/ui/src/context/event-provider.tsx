import { useState, useCallback } from "react";
import { EventContext, type EventPayloads } from "./event-context";

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Partial<EventPayloads>>({});

  const setEvent = useCallback(
    <K extends keyof EventPayloads>(key: K, value: EventPayloads[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <EventContext.Provider
      value={{
        state,
        setEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}
