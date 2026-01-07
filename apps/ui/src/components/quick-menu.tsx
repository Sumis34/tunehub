import { animate, useMotionValue, motion, type PanInfo } from "framer-motion";

export default function QuickMenu({ children }: { children: React.ReactNode }) {
  const OPEN_HEIGHT = 0.2;
  const HANDLE_HEIGHT = 44;
  const SNAP_THRESHOLD = 0.1;

  const h = window.innerHeight;
  const closed = -h;
  const open = -h * OPEN_HEIGHT;
  const paddingTop = h * OPEN_HEIGHT;

  const y = useMotionValue(closed);

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
      <motion.div
        drag="y"
        style={{ paddingBottom: HANDLE_HEIGHT, height: h + HANDLE_HEIGHT, y }}
        dragConstraints={{ top: closed, bottom: open + 20 }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 pointer"
      >
        <div
          style={{
            paddingTop,
          }}
          className="bg-neutral-900 h-full flex flex-col items-center rounded-b-xl"
        >
          <div className="flex-1">asd</div>
          <div className="p-4">
            <div className="w-24 h-2 bg-neutral-800 rounded-full" />
          </div>
        </div>
      </motion.div>
      {children}
    </div>
  );
}
