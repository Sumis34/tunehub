import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import Header from "../../components/header";
import { useEffect } from "react";
import { useEventContext } from "../../hooks/use-event-context";

const STAND_BY_TIMEOUT_MS = 7 * 60 * 1000; // 7 minutes

export const Route = createFileRoute("/app")({
  component: MainLayoutComponent,
});

function MainLayoutComponent() {
  const navigate = useNavigate();
  
  const { lastEventTime } = useEventContext();

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        new Date().getTime() - lastEventTime.getTime() <
        STAND_BY_TIMEOUT_MS
      ) return 
      
        navigate({
          to: "/screen-saver",
        });
    }, 5 * 1000);

    return () => clearInterval(interval);
  }, [navigate, lastEventTime]);
  return (
    <div className="h-full w-full flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
}
