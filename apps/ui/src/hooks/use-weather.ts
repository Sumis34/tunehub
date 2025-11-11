import { useEffect, useRef, useState, useCallback } from "react";

export default function useWeather(lat?: number, lon?: number) {
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchWeather = useCallback(async () => {
    if (typeof lat !== "number" || typeof lon !== "number") return;
    setLoading(true);
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      const json = await res.json();
      // try to read a reasonable field for current temperature; no robust error handling as requested
      const temp = json?.current?.temperature_2m ?? null;
      setTemperature(typeof temp === "number" ? temp : null);
    } catch {
      // intentionally empty: no error handling per request
      setTemperature(null);
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchWeather();
    return () => {
      controllerRef.current?.abort();
    };
  }, [fetchWeather]);

  const refetch = useCallback(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { temperature, loading, refetch } as const;
}