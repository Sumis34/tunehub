import { useCallback, useEffect, useRef, useState } from "react";

type SmoothOptions = {
  speed?: number;
  epsilon?: number;
};

export function useSmoothValue(
  target: number,
  options: SmoothOptions = {}
): number {
  const { speed = 0.15, epsilon = 0.01 } = options;

  const [value, setValue] = useState<number>(target);

  const targetRef = useRef(target);
  const currentRef = useRef(target);
  const speedRef = useRef(speed);
  const epsilonRef = useRef(epsilon);
  const frameRef = useRef<number | null>(null);

  targetRef.current = target;
  speedRef.current = speed;
  epsilonRef.current = epsilon;

  const startLoop = useCallback(() => {
    if (frameRef.current !== null) return;

    const animate = () => {
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) < epsilonRef.current) {
        currentRef.current = targetRef.current;
        setValue(targetRef.current);
        frameRef.current = null;
        return;
      }
      currentRef.current += diff * speedRef.current;
      setValue(currentRef.current);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    startLoop();
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [target, startLoop]);

  return value;
}
