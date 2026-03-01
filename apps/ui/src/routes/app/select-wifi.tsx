import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { usePlayer } from "../../hooks/use-player";

export const Route = createFileRoute("/app/select-wifi")({
  component: RouteComponent,
});

function RouteComponent() {
  const { wifiStatus, wifiResult, refreshWifiStatus, disconnectWifi } = usePlayer();

  useEffect(() => {
    refreshWifiStatus();
  }, [refreshWifiStatus]);

  const manageUrl = wifiStatus.manageUrl || `${window.location.origin}/config/wifi`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(manageUrl)}`;

  return (
    <div className="grid grid-cols-2 flex-1 min-h-0 text-neutral-100 p-3 sm:p-4 gap-3 sm:gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Wi-Fi setup</h1>
        <p className="text-base sm:text-xl text-neutral-400">
          This screen shows the device network state and provides a QR code for the full Wi-Fi
          configuration page on a phone.
        </p>

        <div className="mt-3 sm:mt-4 bg-neutral-900 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
          <div className="text-base sm:text-xl font-semibold flex items-center gap-2">
            {wifiStatus.connected ? (
              <>
                <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                <span className="truncate">Connected to {wifiStatus.ssid}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                AP mode active ({wifiStatus.apSsid})
              </>
            )}
          </div>

          {wifiStatus.ip ? (
            <p className="text-sm sm:text-lg text-neutral-400 truncate">Address: {wifiStatus.ip}</p>
          ) : null}

          <button
            onClick={() => {
              disconnectWifi();
              refreshWifiStatus();
            }}
            className="w-full text-left px-3 py-2 rounded-md font-medium bg-neutral-800 text-white active:bg-neutral-700 text-sm sm:text-base"
          >
            Disconnect
          </button>

          {wifiResult?.message ? (
            <p className={`text-sm ${wifiResult.ok ? "text-green-400" : "text-red-400"}`}>
              {wifiResult.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-3 sm:p-4 min-h-0 flex flex-col items-center justify-center gap-3">
        <img
          src={qrUrl}
          alt="QR code for Wi-Fi configuration page"
          className="w-52 h-52 sm:w-60 sm:h-60 rounded-md bg-white p-2"
        />
        <p className="text-sm sm:text-base text-neutral-400 text-center break-all">{manageUrl}</p>
      </div>
    </div>
  );
}
