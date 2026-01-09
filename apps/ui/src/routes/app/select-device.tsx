import { createFileRoute, useNavigate } from "@tanstack/react-router";
import NoDeviceSelected from "../../context/no-deivce-selected";

export const Route = createFileRoute("/app/select-device")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <NoDeviceSelected
      onSelectDevice={() => {
        navigate({ to: "/app/radio" });
      }}
    />
  );
}
