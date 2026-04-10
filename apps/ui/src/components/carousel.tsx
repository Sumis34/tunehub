import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";

const GAP = 16; // px gap between slides

export const Carousel = ({
  items,
  className,
}: {
  items: React.ReactNode[];
  className?: string;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  const width = containerRef.current?.offsetWidth || 1
  const step =  width + GAP

  const snapToIndex = useCallback(
    (index: number) => {
      return animate(x, -index * step, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    },
    [x, step]
  );
  useEffect(() => {
    const controls = snapToIndex(activeIndex);
    return controls.stop;
  }, [activeIndex, snapToIndex]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    let newIndex = activeIndex;

    const shouldGoNext = offset < -step / 4 || velocity < -500;
    const shouldGoPrev = offset > step / 4 || velocity > 500;

    if (shouldGoNext) {
      newIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (shouldGoPrev) {
      newIndex = Math.max(activeIndex - 1, 0);
    }

    if (newIndex === activeIndex) {
      snapToIndex(activeIndex);
    } else {
      setActiveIndex(newIndex);
    }
  };

  return (
    <div ref={containerRef} className={`${className || ""}`}>
      <div className="relative h-full">
        <motion.div
          className="flex h-full"
          style={{ x, gap: `${GAP}px` }}
          drag="x"
          dragConstraints={{
            left: -((items.length - 1) * step),
            right: 0,
          }}
          onDragEnd={handleDragEnd}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="min-w-full flex items-center justify-center h-full"
            >
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
