import asyncio
import os
import sys
from copy import deepcopy
from typing import Any


class WifiError(Exception):
    pass


MOCK_MODE = sys.platform == "win32" or os.getenv("TUNEHUB_WIFI_MOCK", "").lower() in {
    "1",
    "true",
    "yes",
}

SERVER_PORT = int(os.getenv("TUNEHUB_SERVER_PORT", "8000"))
AP_CONNECTION_NAME = os.getenv("TUNEHUB_AP_CONNECTION_NAME", "tunehub-ap")
AP_SSID = os.getenv("TUNEHUB_AP_SSID", "TuneHub-Setup")
AP_PASSWORD = os.getenv("TUNEHUB_AP_PASSWORD", "tunehubsetup")
AP_GATEWAY_IP = os.getenv("TUNEHUB_AP_GATEWAY_IP", "10.42.0.1")

_MOCK_NETWORKS: list[dict[str, Any]] = [
    {
        "ssid": "HomeNet",
        "signal": 84,
        "secured": True,
        "security": "WPA2",
        "active": True,
        "saved": True,
    },
    {
        "ssid": "Guest WiFi",
        "signal": 72,
        "secured": False,
        "security": "--",
        "active": False,
        "saved": False,
    },
    {
        "ssid": "Office-5G",
        "signal": 61,
        "secured": True,
        "security": "WPA2 WPA3",
        "active": False,
        "saved": True,
    },
    {
        "ssid": "LockedLab",
        "signal": 46,
        "secured": True,
        "security": "WPA2",
        "active": False,
        "saved": False,
    },
]

_MOCK_STATUS: dict[str, Any] = {
    "connected": True,
    "ssid": "HomeNet",
    "device": "wlan0",
    "ip": "192.168.1.150",
    "signal": 84,
}


def _split_nmcli_line(line: str) -> list[str]:
    fields: list[str] = []
    current: list[str] = []
    escaped = False

    for ch in line:
        if escaped:
            current.append(ch)
            escaped = False
            continue
        if ch == "\\":
            escaped = True
            continue
        if ch == ":":
            fields.append("".join(current))
            current = []
            continue
        current.append(ch)

    fields.append("".join(current))
    return fields


def _build_manage_url(host: str | None) -> str:
    target_host = host if host else AP_GATEWAY_IP
    return f"http://{target_host}:{SERVER_PORT}/config/wifi"


def _decorate_status(status: dict[str, Any], mode: str) -> dict[str, Any]:
    decorated = deepcopy(status)
    decorated["mode"] = mode
    decorated["apSsid"] = AP_SSID

    if mode == "ap":
        decorated["manageUrl"] = _build_manage_url(AP_GATEWAY_IP)
    else:
        decorated["manageUrl"] = _build_manage_url(decorated.get("ip"))

    return decorated


def _mock_snapshot_networks() -> list[dict[str, Any]]:
    return sorted(
        deepcopy(_MOCK_NETWORKS),
        key=lambda n: (not n["active"], -n["signal"], n["ssid"].lower()),
    )


def _mock_status_copy() -> dict[str, Any]:
    mode = "station" if _MOCK_STATUS.get("connected") else "ap"
    return _decorate_status(_MOCK_STATUS, mode)


def _mock_apply_connection(ssid: str | None) -> None:
    for network in _MOCK_NETWORKS:
        network["active"] = network["ssid"] == ssid
        if ssid and network["ssid"] == ssid:
            network["saved"] = True

    if not ssid:
        _MOCK_STATUS.update(
            {
                "connected": False,
                "ssid": None,
                "device": "wlan0",
                "ip": AP_GATEWAY_IP,
                "signal": None,
            }
        )
        return

    selected = next((n for n in _MOCK_NETWORKS if n["ssid"] == ssid), None)
    if not selected:
        return

    signal = int(selected.get("signal", 0))
    suffix = 20 + (sum(ord(c) for c in ssid) % 200)
    _MOCK_STATUS.update(
        {
            "connected": True,
            "ssid": ssid,
            "device": "wlan0",
            "ip": f"192.168.1.{suffix}",
            "signal": signal,
        }
    )


async def _run_nmcli(args: list[str], timeout: float = 20.0) -> str:
    try:
        process = await asyncio.create_subprocess_exec(
            "nmcli",
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        raise WifiError("nmcli not found") from exc

    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
    except asyncio.TimeoutError as exc:
        process.kill()
        raise WifiError("nmcli command timed out") from exc

    if process.returncode != 0:
        error = stderr.decode("utf-8", errors="ignore").strip() or "nmcli command failed"
        raise WifiError(error)

    return stdout.decode("utf-8", errors="ignore")


async def _run_nmcli_allow_failure(args: list[str], timeout: float = 20.0) -> str:
    try:
        return await _run_nmcli(args, timeout=timeout)
    except WifiError:
        return ""


async def _get_saved_wifi_names() -> set[str]:
    output = await _run_nmcli(["-t", "-f", "NAME,TYPE", "connection", "show"])
    names: set[str] = set()

    for raw in output.splitlines():
        if not raw.strip():
            continue
        parts = _split_nmcli_line(raw)
        if len(parts) < 2:
            continue
        name, conn_type = parts[0], parts[1]
        if conn_type == "802-11-wireless" and name:
            names.add(name)

    return names


async def _get_wifi_device() -> str | None:
    output = await _run_nmcli(["-t", "-f", "DEVICE,TYPE", "device", "status"])
    for raw in output.splitlines():
        if not raw.strip():
            continue
        parts = _split_nmcli_line(raw)
        if len(parts) < 2:
            continue
        device, dev_type = parts[0], parts[1]
        if dev_type == "wifi" and device:
            return device
    return None


async def _get_device_ip(device: str) -> str | None:
    output = await _run_nmcli_allow_failure(["-g", "IP4.ADDRESS", "device", "show", device])
    ip_line = next((line for line in output.splitlines() if line.strip()), "")
    if not ip_line:
        return None
    return ip_line.split("/", 1)[0]


async def _stop_ap_mode() -> None:
    await _run_nmcli_allow_failure(["connection", "down", AP_CONNECTION_NAME], timeout=20.0)


async def _start_ap_mode(device: str) -> None:
    output = await _run_nmcli(["-t", "-f", "NAME", "connection", "show"])
    names = {line.strip() for line in output.splitlines() if line.strip()}

    if AP_CONNECTION_NAME not in names:
        await _run_nmcli(
            [
                "connection",
                "add",
                "type",
                "wifi",
                "ifname",
                device,
                "con-name",
                AP_CONNECTION_NAME,
                "autoconnect",
                "yes",
                "ssid",
                AP_SSID,
            ],
            timeout=30.0,
        )

    await _run_nmcli(
        [
            "connection",
            "modify",
            AP_CONNECTION_NAME,
            "802-11-wireless.mode",
            "ap",
            "802-11-wireless.band",
            "bg",
            "ipv4.method",
            "shared",
            "ipv6.method",
            "ignore",
            "wifi-sec.key-mgmt",
            "wpa-psk",
            "wifi-sec.psk",
            AP_PASSWORD,
        ],
        timeout=30.0,
    )

    await _run_nmcli(["connection", "up", AP_CONNECTION_NAME], timeout=30.0)


async def _get_station_status() -> dict[str, Any]:
    status = {
        "connected": False,
        "ssid": None,
        "device": None,
        "ip": None,
        "signal": None,
    }

    dev_output = await _run_nmcli(["-t", "-f", "DEVICE,TYPE,STATE,CONNECTION", "device", "status"])
    for raw in dev_output.splitlines():
        if not raw.strip():
            continue
        parts = _split_nmcli_line(raw)
        if len(parts) < 4:
            continue

        device, dev_type, dev_state, connection = parts[0], parts[1], parts[2], parts[3]
        if dev_type != "wifi":
            continue

        status["device"] = device
        if dev_state == "connected" and connection != AP_CONNECTION_NAME:
            status["connected"] = True
            status["ssid"] = connection or None
        break

    if status["device"]:
        status["ip"] = await _get_device_ip(str(status["device"]))

    wifi_output = await _run_nmcli_allow_failure(["-t", "-f", "IN-USE,SSID,SIGNAL", "device", "wifi", "list"])
    for raw in wifi_output.splitlines():
        if not raw.strip():
            continue
        in_use, ssid, signal = (_split_nmcli_line(raw) + ["", "", ""])[:3]
        if in_use.strip() != "*":
            continue
        if status["connected"] and not status["ssid"]:
            status["ssid"] = ssid or None
        try:
            status["signal"] = int(signal)
        except ValueError:
            status["signal"] = None
        break

    return status


async def scan_networks() -> list[dict[str, Any]]:
    if MOCK_MODE:
        return _mock_snapshot_networks()

    saved = await _get_saved_wifi_names()
    output = await _run_nmcli(
        [
            "-t",
            "-f",
            "IN-USE,SSID,SIGNAL,SECURITY",
            "device",
            "wifi",
            "list",
            "--rescan",
            "auto",
        ]
    )

    by_ssid: dict[str, dict[str, Any]] = {}
    for raw in output.splitlines():
        if not raw.strip():
            continue

        in_use, ssid, signal, security = (_split_nmcli_line(raw) + ["", "", "", ""])[:4]
        ssid = ssid.strip()
        if not ssid or ssid == AP_SSID:
            continue

        try:
            signal_value = int(signal)
        except ValueError:
            signal_value = 0

        network = {
            "ssid": ssid,
            "signal": max(0, min(signal_value, 100)),
            "secured": security.strip() not in ("", "--"),
            "security": security.strip(),
            "active": in_use.strip() == "*",
            "saved": ssid in saved,
        }

        prev = by_ssid.get(ssid)
        if not prev or network["signal"] > prev["signal"]:
            by_ssid[ssid] = network

    return sorted(by_ssid.values(), key=lambda n: (not n["active"], -n["signal"], n["ssid"].lower()))


async def get_status() -> dict[str, Any]:
    if MOCK_MODE:
        return _mock_status_copy()

    status = await _get_station_status()
    device = status.get("device")

    if status.get("connected"):
        await _stop_ap_mode()
        return _decorate_status(status, "station")

    if not device:
        return _decorate_status(status, "ap")

    await _start_ap_mode(str(device))
    ap_ip = await _get_device_ip(str(device)) or AP_GATEWAY_IP

    ap_status = {
        "connected": False,
        "ssid": None,
        "device": device,
        "ip": ap_ip,
        "signal": None,
    }
    return _decorate_status(ap_status, "ap")


async def connect(ssid: str, password: str | None = None) -> dict[str, Any]:
    if not ssid or not ssid.strip():
        raise WifiError("SSID is required")

    ssid = ssid.strip()

    if MOCK_MODE:
        network = next((n for n in _MOCK_NETWORKS if n["ssid"] == ssid), None)
        if not network:
            raise WifiError("Network not found")
        if network["secured"] and not password:
            raise WifiError("Password required")
        if ssid == "LockedLab" and password != "letmein123":
            raise WifiError("Invalid password")

        _mock_apply_connection(ssid)
        return _mock_status_copy()

    await _stop_ap_mode()
    args = ["device", "wifi", "connect", ssid]
    if password:
        args.extend(["password", password])

    await _run_nmcli(args, timeout=30.0)
    return await get_status()


async def disconnect() -> dict[str, Any]:
    if MOCK_MODE:
        _mock_apply_connection(None)
        return _mock_status_copy()

    device = await _get_wifi_device()
    if not device:
        raise WifiError("No Wi-Fi device found")

    await _run_nmcli_allow_failure(["device", "disconnect", device], timeout=20.0)
    return await get_status()


async def forget(ssid: str) -> None:
    if not ssid or not ssid.strip():
        raise WifiError("SSID is required")

    ssid = ssid.strip()

    if MOCK_MODE:
        network = next((n for n in _MOCK_NETWORKS if n["ssid"] == ssid), None)
        if not network:
            raise WifiError("Saved network not found")
        network["saved"] = False
        if _MOCK_STATUS.get("ssid") == ssid:
            _mock_apply_connection(None)
        return

    output = await _run_nmcli(["-t", "-f", "NAME,TYPE", "connection", "show"])
    targets: list[str] = []

    for raw in output.splitlines():
        if not raw.strip():
            continue
        parts = _split_nmcli_line(raw)
        if len(parts) < 2:
            continue
        name, conn_type = parts[0], parts[1]
        if conn_type == "802-11-wireless" and name == ssid:
            targets.append(name)

    if not targets:
        raise WifiError("Saved network not found")

    for name in targets:
        await _run_nmcli(["connection", "delete", name], timeout=20.0)
