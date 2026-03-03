#!/bin/bash
set -e

APP_DIR="/opt/tunehub"
SERVICE_NAME="tunehubd.service"
WIFI_SERVICE_NAME="wificonnect.service"
USER_NAME="$(whoami)"

echo "[*] Creating app directory at $APP_DIR..."

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER_NAME":"$USER_NAME" "$APP_DIR"

echo "[*] Moving source files to $APP_DIR..."
shopt -s dotglob nullglob
for item in *; do
    # Skip install script and systemd unit files
    if [[ "$item" != "install.sh" && "$item" != "$SERVICE_NAME" && "$item" != "$WIFI_SERVICE_NAME" ]]; then
        mv "$item" "$APP_DIR"/
    fi
done
shopt -u dotglob nullglob

echo "[*] Moving systemd service file to /etc/systemd/system..."
sudo mv "$SERVICE_NAME" /etc/systemd/system/"$SERVICE_NAME"
if [ -f "$WIFI_SERVICE_NAME" ]; then
    sudo mv "$WIFI_SERVICE_NAME" /etc/systemd/system/"$WIFI_SERVICE_NAME"
fi

echo "[*] Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "[*] Setting permissions on $APP_DIR..."
sudo chown -R "$USER_NAME":"$USER_NAME" "$APP_DIR"

cd "$APP_DIR"

echo "[*] Installing wifi-connect if missing..."
if ! command -v wifi-connect >/dev/null 2>&1; then
    curl -L https://github.com/balena-io/wifi-connect/raw/master/scripts/raspbian-install.sh | sed 's/\*rpi/*aarch64/' | sudo bash
fi

if [ -f start-wifi-connect.sh ]; then
    chmod +x start-wifi-connect.sh
fi

echo "[*] Creating virtual environment if missing..."
if [ ! -d venv ]; then
    python3 -m venv venv
fi

echo "[*] Upgrading pip and wheel..."
venv/bin/pip install --upgrade pip wheel

echo "[*] Installing dependencies..."
if [ -f requirements.txt ]; then
    venv/bin/pip install -r requirements.txt
else
    echo "[!] No requirements.txt found — skipping dependency install"
fi

echo "[*] Setting up .xinitrc for Chromium kiosk autostart..."
XINITRC_PATH="/home/$USER_NAME/.xinitrc"
cat > "$XINITRC_PATH" <<'EOF'
#!/bin/sh

xset -dpms
xset s off
xset s noblank

unclutter &

chromium http://localhost:8000 \
    --kiosk \
    --incognito \
    --noerrdialogs \
    --disable-translate \
    --no-first-run \
    --disable-infobars \
    --disk-cache-dir=/dev/null \
    --disable-pinch
EOF
chown "$USER_NAME":"$USER_NAME" "$XINITRC_PATH"
chmod +x "$XINITRC_PATH"

echo "[*] Enabling the $SERVICE_NAME service..."
sudo systemctl enable "$SERVICE_NAME"

if [ -f "/etc/systemd/system/$WIFI_SERVICE_NAME" ]; then
    echo "[*] Enabling the $WIFI_SERVICE_NAME service..."
    sudo systemctl enable "$WIFI_SERVICE_NAME"
fi

echo "[*] Starting the $SERVICE_NAME service..."
sudo systemctl restart "$SERVICE_NAME"

if [ -f "/etc/systemd/system/$WIFI_SERVICE_NAME" ]; then
    echo "[*] Starting the $WIFI_SERVICE_NAME service..."
    sudo systemctl restart "$WIFI_SERVICE_NAME"
fi

echo "[✓] Install complete. TuneHub service is running."
