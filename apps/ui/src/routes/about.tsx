import { createFileRoute } from "@tanstack/react-router";
import { Marquee } from "../components/marquee-text";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="text-white">
      <Marquee className="w-48">
        Very long and interesting text goes here, because its important.
      </Marquee>
    </div>
  );
}
