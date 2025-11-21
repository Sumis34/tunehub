import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate({ from: "/" });

  navigate({ to: "/screen-saver" });

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
