import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { usePlayer } from "../../hooks/use-player";

export const Route = createFileRoute("/config/wifi")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    wifiNetworks,
    wifiStatus,
    wifiResult,
    scanWifi,
    refreshWifiStatus,
    connectWifi,
    disconnectWifi,
    forgetWifi,
  } = usePlayer();

  const [selectedSsid, setSelectedSsid] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    scanWifi();
    refreshWifiStatus();
  }, [scanWifi, refreshWifiStatus]);

  useEffect(() => {
    if (!wifiResult) return;
    setIsConnecting(false);
  }, [wifiResult]);

  const selectedNetwork = useMemo(
    () => wifiNetworks.find((network) => network.ssid === selectedSsid),
    [wifiNetworks, selectedSsid]
  );

  const handleSelect = (ssid: string) => {
    setSelectedSsid(ssid);
    setPassword("");
  };

  const handleConnect = () => {
    if (!selectedNetwork) return;
    setIsConnecting(true);
    connectWifi(selectedNetwork.ssid, selectedNetwork.secured ? password : undefined);
  };

  return (
    <div className="h-full min-h-0 bg-neutral-950 text-neutral-100 p-3 sm:p-4 flex flex-col gap-3">
      <div className="bg-neutral-900 rounded-lg p-3 sm:p-4">
        <h1 className="text-xl sm:text-2xl font-bold">Configure Wi-Fi</h1>
        <p className="text-sm sm:text-base text-neutral-400">
          This page provides full Wi-Fi connection management for the device and applies changes
          directly to its network configuration.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm sm:text-base">
          {wifiStatus.connected ? (
            <span className="inline-flex items-center gap-2 text-green-400">
              <Wifi className="w-4 h-4" />
              Connected to {wifiStatus.ssid}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-amber-400">
              <WifiOff className="w-4 h-4" />
              AP mode active ({wifiStatus.apSsid})
            </span>
          )}
          {wifiStatus.ip ? <span className="text-neutral-400">Address {wifiStatus.ip}</span> : null}
        </div>

        <button
          onClick={() => {
            scanWifi();
            refreshWifiStatus();
          }}
          className="mt-3 px-3 py-2 rounded-md font-medium bg-neutral-800 text-white flex items-center gap-2 active:bg-neutral-700 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-neutral-900 rounded-lg p-2 sm:p-3 min-h-0 flex-1 overflow-y-auto">
        {wifiNetworks.length === 0 ? (
          <p className="text-neutral-500 text-base text-center p-4">No Wi-Fi networks found.</p>
        ) : (
          <ul className="divide-neutral-800 divide-y">
            {wifiNetworks.map((network) => (
              <button
                onClick={() => handleSelect(network.ssid)}
                key={network.ssid}
                className={`py-3 px-2 flex items-center justify-between gap-3 text-neutral-100 text-base transition-all w-full text-left font-semibold active:bg-neutral-800 ${selectedSsid === network.ssid ? "bg-neutral-800" : ""}`}
              >
                <span className="truncate pr-2">{network.ssid}</span>
                <span className="text-sm text-neutral-400 flex items-center gap-2 shrink-0">
                  {network.secured ? <Lock className="w-4 h-4" /> : null}
                  {network.signal}%
                </span>
              </button>
            ))}
          </ul>
        )}
      </div>

      {selectedNetwork ? (
        <div className="bg-neutral-900 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
          <p className="text-base sm:text-lg font-semibold flex items-center gap-2 min-w-0">
            {selectedNetwork.secured ? <Lock className="w-4 h-4 shrink-0" /> : null}
            <span className="truncate">{selectedNetwork.ssid}</span>
          </p>
          <p className="text-sm text-neutral-400">Signal: {selectedNetwork.signal}%</p>

          {selectedNetwork.secured ? (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wi-Fi password"
              className="w-full px-3 py-2 rounded-md bg-neutral-800 text-neutral-100 text-base outline-none border border-neutral-700 focus:border-blue-400"
            />
          ) : null}

          <button
            onClick={handleConnect}
            disabled={isConnecting || (selectedNetwork.secured && password.length === 0)}
            className="w-full text-left px-3 py-2 rounded-md font-medium bg-blue-600 text-white active:bg-blue-500 disabled:opacity-50 text-sm"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>

          <button
            onClick={() => disconnectWifi()}
            className="w-full text-left px-3 py-2 rounded-md font-medium bg-neutral-800 text-white active:bg-neutral-700 text-sm"
          >
            Disconnect current network
          </button>

          <button
            onClick={() => forgetWifi(selectedNetwork.ssid)}
            className="w-full text-left px-3 py-2 rounded-md font-medium bg-neutral-800 text-white active:bg-neutral-700 text-sm"
          >
            Forget this network
          </button>

          {wifiResult?.message ? (
            <p className={`text-sm ${wifiResult.ok ? "text-green-400" : "text-red-400"}`}>
              {wifiResult.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
