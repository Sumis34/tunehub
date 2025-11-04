import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/screen-saver")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-black w-full h-full flex items-center justify-center">
      <h1 className="text-8xl text-white">19:46</h1>
    </div>
  );
}
