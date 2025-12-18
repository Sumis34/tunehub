import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import Header from "../../components/header";
import { useEffect } from "react";

const STAND_BY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const Route = createFileRoute("/app")({
  component: MainLayoutComponent,
});

function MainLayoutComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      // navigate({
      //   to: "/screen-saver",
      // });
    }, STAND_BY_TIMEOUT_MS);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="h-full w-full flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
}
