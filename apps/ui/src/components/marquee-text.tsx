import { useEffect, useRef, useState } from "react";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function Marquee({ children, className = "" }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const calculate = () => {
      if (!containerRef.current || !textRef.current) return;
      const gap = textRef.current.scrollWidth - containerRef.current.clientWidth;
      setOverflow(Math.max(0, gap));
    };

    calculate();

    const ro = new ResizeObserver(calculate);
    if (containerRef.current) ro.observe(containerRef.current);
    if (textRef.current) ro.observe(textRef.current);

    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className={`group whitespace-nowrap overflow-x-hidden ${className}`}>
      <span
        ref={textRef}
        style={
          overflow > 0
            ? ({ "--overflow": `-${overflow}px` } as React.CSSProperties)
            : undefined
        }
        className={
          overflow > 0
            ? "inline-block animate-[marquee_12s_linear_infinite] group-active:[animation-play-state:paused]"
            : "inline-block"
        }
      >
        {children}
      </span>
    </div>
  );
}
