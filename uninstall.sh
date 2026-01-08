#!/bin/bash
set -euo pipefail

APP_DIR="/opt/tunehub"
SERVICE_NAME="tunehubd.service"

echo "[*] Stopping service $SERVICE_NAME (if running)..."
sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true

echo "[*] Disabling service $SERVICE_NAME (if enabled)..."
sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true

UNIT_PATH="/etc/systemd/system/$SERVICE_NAME"
if [ -f "$UNIT_PATH" ]; then
  echo "[*] Removing unit file at $UNIT_PATH..."
  sudo rm -f "$UNIT_PATH"
else
  echo "[i] Unit file not found at $UNIT_PATH — skipping"
fi

echo "[*] Reloading systemd daemon..."
sudo systemctl daemon-reload
sudo systemctl reset-failed "$SERVICE_NAME" 2>/dev/null || true

if [ -d "$APP_DIR" ]; then
  echo "[*] Removing application directory $APP_DIR..."
  sudo rm -rf "$APP_DIR"
else
  echo "[i] Application directory $APP_DIR not found — skipping"
fi

echo "[✓] Uninstall complete."