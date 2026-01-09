import { useState, useEffect, useRef } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Source - https://stackoverflow.com/a
// Posted by bingles, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-09, License - CC BY-SA 4.0
function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  wait: number
) {
  // track args & timeout handle between calls
  const argsRef = useRef<A>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);

  function cleanup() {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }

  // make sure our timeout gets cleared if
  // our consuming component gets unmounted
  useEffect(() => cleanup, []);

  return function debouncedCallback(...args: A) {
    // capture latest args
    argsRef.current = args;

    // clear debounce timer
    cleanup();

    // start waiting again
    timeout.current = setTimeout(() => {
      if (argsRef.current) {
        callback(...argsRef.current);
      }
    }, wait);
  };
}

export { useDebounce, useDebouncedCallback };
