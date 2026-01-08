import {
  animate,
  useMotionValue,
  motion,
  type PanInfo,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useState } from "react";
import { createPortal } from "react-dom";
import Button from "../ui/button";

export default function QuickMenu({ children }: { children: React.ReactNode }) {
  const OPEN_HEIGHT = 0.2;
  const HANDLE_HEIGHT = 44;
  const SNAP_THRESHOLD = 0.1;

  const h = window.innerHeight;
  const closed = -h;
  const open = -h * OPEN_HEIGHT;
  const paddingTop = h * OPEN_HEIGHT;

  const y = useMotionValue(closed);
  const opacity = useTransform(y, [closed, open], [0, 0.5]);

  const [shouldDrag, setShouldDrag] = useState(true);

  const [isOpen, setIsOpen] = useState(false);

  useMotionValueEvent(y, "change", (latest) => {
    setIsOpen(latest > closed + 1);
  });

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = h * SNAP_THRESHOLD;
    const isDraggingUp = info.offset.y < 0;

    let target = closed;

    if (isDraggingUp && y.get() > open - threshold) {
      target = open;
    } else if (!isDraggingUp && y.get() < closed + threshold) {
      target = closed;
    } else if (!isDraggingUp) {
      target = open;
    }

    animate(y, target, { type: "spring", stiffness: 600, damping: 50 });
  };

  return (
    <div className="relative">
      {createPortal(
        <>
          {isOpen && (
            <motion.div
              onClick={() => {
                animate(y, closed, {
                  type: "spring",
                  stiffness: 600,
                  damping: 50,
                });
              }}
              style={{
                opacity,
              }}
              className="fixed inset-0 bg-black"
            />
          )}
          <motion.div
            drag={shouldDrag ? "y" : false}
            style={{
              paddingBottom: HANDLE_HEIGHT,
              height: h + HANDLE_HEIGHT,
              y,
            }}
            dragConstraints={{ top: closed, bottom: open + 20 }}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            className="fixed inset-0 z-10"
          >
            <div
              style={{
                paddingTop,
              }}
              className="bg-neutral-950 h-full flex flex-col items-center rounded-b-xl"
            >
              <div className="flex-1">
                asd
                <Button>
                  Test Button
                </Button>
                <input
                  type="range"
                  onPointerDown={() => {
                    setShouldDrag(false);
                  }}
                  onPointerUp={() => {
                    setShouldDrag(true);
                  }}
                />
                <input type="text" />
              </div>
              <div className="p-4">
                <div className="w-24 h-2 bg-neutral-800 rounded-full" />
              </div>
            </div>
          </motion.div>
        </>,
        document.body
      )}
      {children}
    </div>
  );
}
