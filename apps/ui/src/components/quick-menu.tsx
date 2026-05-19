import {
  animate,
  useMotionValue,
  motion,
  type PanInfo,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "../ui/button";
import { useNavigate } from "@tanstack/react-router";
import { MoonStar, Speaker, Volume2, Sliders, VolumeOff } from "lucide-react";
import TouchSlider from "./slider";
import { usePlayer } from "../hooks/use-player";
import { useQuickMenu } from "../hooks/use-quick-menu";

const OPEN_HEIGHT = 0.4;
const HANDLE_HEIGHT = 44;
const SNAP_THRESHOLD = 0.1;
const SPRING = { type: "spring" as const, stiffness: 600, damping: 50 };

export default function QuickMenu({ children }: { children: React.ReactNode }) {
  const h = window.innerHeight;
  const closed = -h;
  const open = -h * OPEN_HEIGHT;
  const paddingTop = h * OPEN_HEIGHT;

  const y = useMotionValue(closed);
  const opacity = useTransform(y, [closed, open], [0, 0.5]);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { changeVolume, volume } = usePlayer();

  const {
    isOpen,
    open: openMenu,
    close: closeMenu,
    markInteraction,
  } = useQuickMenu();

  useEffect(() => {
    animate(y, isOpen ? open : closed, SPRING);
  }, [isOpen, y, open, closed]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    markInteraction();

    const threshold = h * SNAP_THRESHOLD;
    const isDraggingUp = info.offset.y < 0;

    let shouldOpen = false;

    if (isDraggingUp && y.get() > open - threshold) {
      shouldOpen = true;
    } else if (!isDraggingUp && y.get() < closed + threshold) {
      shouldOpen = false;
    } else if (!isDraggingUp) {
      shouldOpen = true;
    }

    // When nothing changes, manually animate to old pos. because useEffect doesn't run when isOpen doesn't change
    if (shouldOpen === isOpen) {
      animate(y, shouldOpen ? open : closed, SPRING);
      return;
    }

    // Update state to trigger useEffect which animates to new pos.
    if (shouldOpen) {
      openMenu();
    } else {
      closeMenu();
    }
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
              onClick={closeMenu}
              style={{ opacity }}
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
            onMouseDown={markInteraction}
            onClick={() => {
              if (!isOpen) {
                openMenu();
              }
            }}
            ref={ref}
          >
            <div
              style={{ paddingTop }}
              className="bg-neutral-950 h-full flex flex-col items-center rounded-b-xl"
            >
              <div className="flex-1 grid grid-rows-2 grid-cols-3 p-4 gap-4 w-full container mx-auto max-w-sm">
                <Button
                  onClick={() => {
                    navigate({ to: "/app/select-device" });
                    closeMenu();
                  }}
                >
                  <Speaker className="h-12 w-12 m-auto" />
                </Button>
                <Button
                  onClick={() => {
                    navigate({ to: "/screen-saver" });
                    closeMenu();
                  }}
                >
                  <MoonStar className="h-12 w-12 m-auto" />
                </Button>
                <Button
                  onClick={() => {
                    navigate({ to: "/app/settings" });
                    closeMenu();
                  }}
                >
                  <Sliders className="h-12 w-12 m-auto" />
                </Button>
                <div className="col-span-3 flex flex-col gap-4">
                  <TouchSlider
                    value={volume}
                    onValueChange={(val) => changeVolume(val)}
                    icon={
                      <>
                        <button
                          onClick={() => {
                            if (volume === 0) {
                              // TODO: restore previous volume ur use actual mute functionality instead of setting volume to 0
                              changeVolume(30);
                            } else {
                              changeVolume(0);
                            }
                          }}
                          className="p-8 -m-8"
                        >
                          {volume === 0 && (
                            <VolumeOff className="h-6 w-6 m-auto" />
                          )}
                          {volume > 0 && <Volume2 className="h-6 w-6 m-auto" />}
                        </button>
                      </>
                    }
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
