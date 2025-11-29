import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/header";

const isDebugMode = import.meta.env.VITE_DEBUG_MODE === "true";

const RootLayout = () => (
  <div className="h-screen w-screen flex flex-col">
    {isDebugMode && (
      <div className={`p-2 gap-3 hidden lg:flex bg-indigo-400 border-b`}>
        DEBUG_MODE:
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/screen-saver" className="[&.active]:font-bold">
          Screen Saver
        </Link>
        <Link to="/app/radio" className="[&.active]:font-bold">
          Radio
        </Link>
      </div>
    )}
    <div className="flex items-center justify-center grow bg-neutral-950">
      <div
        className={`${isDebugMode ? "border-neutral-900" : ""}`}
        style={{
          width: isDebugMode ? import.meta.env.VITE_SCREEN_WIDTH : "100%",
          height: isDebugMode ? import.meta.env.VITE_SCREEN_HEIGHT : "100%",
        }}
      >
        <Outlet />
      </div>
    </div>
    <TanStackRouterDevtools />
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
