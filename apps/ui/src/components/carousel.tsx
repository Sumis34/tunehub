import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ColorThief from "colorthief";

interface CarouselItem {
  image: string;
  alt?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  activeIndex?: number;
  onIndexChange?: (index: number, color: number[] | null) => void;
}

export default function Carousel({
  items,
  activeIndex,
  onIndexChange,
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const internalIndex = useRef(0);
  const x = useMotionValue(0);
  const colors = useRef<Map<number, number[]>>(new Map());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setContainerWidth(entry.contentRect.width)
    );
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (activeIndex === undefined || containerWidth === 0) return;

    const clamped = Math.max(0, Math.min(activeIndex, items.length - 1));

    if (clamped === internalIndex.current) return;

    internalIndex.current = clamped;

    animate(x, -clamped * containerWidth, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  }, [activeIndex, containerWidth, x, items.length]);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, items.length - 1));

    internalIndex.current = clamped;

    if (onIndexChange) {
      onIndexChange(clamped, colors.current.get(clamped) ?? null);
    }

    animate(x, -clamped * containerWidth, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  }

  function onDragEnd(
    _: never,
    info: { velocity: { x: number }; offset: { x: number } }
  ) {
    const { velocity, offset } = info;
    let next = internalIndex.current;
    if (velocity.x < -300 || offset.x < -containerWidth * 0.2) {
      next = Math.min(next + 1, items.length - 1);
    } else if (velocity.x > 300 || offset.x > containerWidth * 0.2) {
      next = Math.max(next - 1, 0);
    }
    goTo(next);
  }

  function handleImageLoad(
    e: React.SyntheticEvent<HTMLImageElement>,
    index: number
  ) {
    const img = e.currentTarget;
    try {
      const colorThief = new ColorThief();
      const color = colorThief.getColor(img);

      colors.current.set(index, color);
      // If this is the current slide, fire immediately so parent isn't waiting
      if (index === internalIndex.current) {
        onIndexChange?.(index, color);
      }
    } catch {
      colors.current.set(index, [64, 64, 64]);
    }
  }

  return (
    <div
      className="overflow-hidden w-full h-full flex items-center"
      ref={containerRef}
    >
      <motion.ul
        drag="x"
        style={{ x }}
        dragConstraints={{
          left: -containerWidth * (items.length - 1),
          right: 0,
        }}
        dragElastic={0.1}
        className="flex"
        onDragEnd={onDragEnd}
      >
        {items.map((item, i) => (
          <li
            key={i}
            style={{ width: containerWidth }}
            className="shrink-0 flex justify-center"
          >
            <img
              src={item.image}
              className="rounded-md h-72 aspect-square"
              crossOrigin="anonymous"
              alt="Carousel item"
              onLoad={(e) => handleImageLoad(e, i)}
            />
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
