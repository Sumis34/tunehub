import { createFileRoute, Outlet } from "@tanstack/react-router";
import Header from "../../components/header";

export const Route = createFileRoute("/app")({
  component: MainLayoutComponent,
});

function MainLayoutComponent() {
  return (
    <div className="h-full w-full flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
}
