import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <div className="h-screen w-screen">
    <div className="p-2 gap-3 hidden lg:flex bg-indigo-400 border-b ">
      DEBUGGER:
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/screen-saver" className="[&.active]:font-bold">
        Screen Saver
      </Link>
      <Link to="/radio" className="[&.active]:font-bold">
        Radio
      </Link>
    </div>
    <div>
      <Outlet />
    </div>
    <TanStackRouterDevtools />
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
