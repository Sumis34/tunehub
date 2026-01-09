import {
  animate,
  useMotionValue,
  motion,
  type PanInfo,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../ui/button";
import { useNavigate } from "@tanstack/react-router";
import { MoonStar, Speaker, SunDim, Volume2 } from "lucide-react";
import TouchSlider from "./slider";
import { usePlayer } from "../hooks/use-player";

export default function QuickMenu({ children }: { children: React.ReactNode }) {
  const OPEN_HEIGHT = 0.4;
  const HANDLE_HEIGHT = 44;
  const SNAP_THRESHOLD = 0.1;

  const h = window.innerHeight;
  const closed = -h;
  const open = -h * OPEN_HEIGHT;
  const paddingTop = h * OPEN_HEIGHT;

  const y = useMotionValue(closed);
  const opacity = useTransform(y, [closed, open], [0, 0.5]);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { changeVolume, volume } = usePlayer();

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

  const close = () => {
    animate(y, closed, { type: "spring", stiffness: 600, damping: 50 });
  };

  const openMenu = () => {
    animate(y, open, { type: "spring", stiffness: 600, damping: 50 });
  };

  const shouldDrag = () => {
    if (!ref.current) return true;
    const draggingChild = ref.current.querySelector("[data-dragging='true']");
    return !draggingChild;
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
            drag={shouldDrag() ? "y" : false}
            style={{
              paddingBottom: HANDLE_HEIGHT,
              height: h + HANDLE_HEIGHT,
              y,
            }}
            dragConstraints={{ top: closed, bottom: open + 20 }}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            className="fixed inset-0 z-10"
            onClick={() => {
              if (isOpen) {
                return;
              }
              openMenu();
            }}
            ref={ref}
          >
            <div
              style={{
                paddingTop,
              }}
              className="bg-neutral-950 h-full flex flex-col items-center rounded-b-xl"
            >
              <div className="flex-1 grid grid-rows-2 grid-cols-2 p-4 gap-4 w-full container mx-auto max-w-sm">
                <Button
                  onClick={() => {
                    navigate({ to: "/app/select-device" });
                    close();
                  }}
                >
                  <Speaker className="h-12 w-12 m-auto" />
                </Button>
                <Button
                  onClick={() => {
                    navigate({ to: "/screen-saver" });
                    close();
                  }}
                >
                  <MoonStar className="h-12 w-12 m-auto" />
                </Button>
                <div className="col-span-2 flex flex-col gap-4">
                  <TouchSlider
                    value={volume}
                    onValueChange={(val) => changeVolume(val)}
                    icon={<Volume2 className="h-6 w-6 stroke-neutral-800" />}
                  />
                  <TouchSlider
                    icon={<SunDim className="h-6 w-6 stroke-neutral-800" />}
                  />
                </div>
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
