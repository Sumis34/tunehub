import {
  animate,
  useMotionValue,
  motion,
  type PanInfo,
} from "framer-motion";

export default function QuickMenu({ children }: { children: React.ReactNode }) {
  const DRAG_AREA_HEIGHT = 44;
  const TOP_BUFFER_HEIGHT = 200;

  const SCREEN_HEIGHT = window.innerHeight;
  const THRESHOLD = SCREEN_HEIGHT * 0.1;
  const TOP_OFF_SCREEN = -SCREEN_HEIGHT - TOP_BUFFER_HEIGHT + DRAG_AREA_HEIGHT;
  const BOTTOM = -TOP_BUFFER_HEIGHT;
  const BOTTOM_DRAG_CONSTRAINT = BOTTOM + 20;

  const y = useMotionValue(TOP_OFF_SCREEN);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const currentY = y.get();
    const dragDirection = info.offset.y;
    const isDirectionUp = dragDirection < 0;

    if (isDirectionUp && currentY > BOTTOM - THRESHOLD) {
      animate(y, BOTTOM, {
        type: "spring",
        stiffness: 600,
        damping: 50,
      });
      return;
    }

    if (!isDirectionUp && currentY < TOP_OFF_SCREEN + THRESHOLD) {
      console.log("here");

      animate(y, TOP_OFF_SCREEN, {
        type: "spring",
        stiffness: 600,
        damping: 50,
      });
      return;
    }

    if (isDirectionUp) {
      animate(y, TOP_OFF_SCREEN, {
        type: "spring",
        stiffness: 600,
        damping: 50,
      });
      return;
    }

    animate(y, BOTTOM, {
      type: "spring",
      stiffness: 600,
      damping: 50,
    });
  };

  return (
    <div>
      <motion.div
        drag="y"
        style={{
          paddingBottom: DRAG_AREA_HEIGHT,
          height: SCREEN_HEIGHT + TOP_BUFFER_HEIGHT,
          y: y,
        }}
        dragConstraints={{
          top: TOP_OFF_SCREEN,
          bottom: BOTTOM_DRAG_CONSTRAINT,
        }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        className="w-full absolute pb-32 inset-0 pointer"
      >
        <div className="w-screen bg-neutral-900 h-full flex flex-col items-center rounded-b-xl">
          <div className="flex-1"></div>
          <div className="p-4">
            <div className="w-24 h-2 bg-neutral-800 rounded-full" />
          </div>
        </div>
      </motion.div>
      {children}
    </div>
  );
}
