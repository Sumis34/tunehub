import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  redirect({
    "to": "/screen-saver",
  });

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
