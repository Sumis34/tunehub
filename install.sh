#!/bin/bash
set -e

APP_DIR="/opt/tunehub"
SERVICE_NAME="tunehubd.service"
USER_NAME="$(whoami)"

echo "[*] Creating app directory at $APP_DIR..."

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER_NAME":"$USER_NAME" "$APP_DIR"

echo "[*] Moving source files to $APP_DIR..."
shopt -s dotglob nullglob
for item in *; do
    # Skip install script and service file
    if [[ "$item" != "install.sh" && "$item" != "$SERVICE_NAME" ]]; then
        mv "$item" "$APP_DIR"/
    fi
done
shopt -u dotglob nullglob

echo "[*] Moving systemd service file to /etc/systemd/system..."
sudo mv "$SERVICE_NAME" /etc/systemd/system/"$SERVICE_NAME"

echo "[*] Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "[*] Setting permissions on $APP_DIR..."
sudo chown -R "$USER_NAME":"$USER_NAME" "$APP_DIR"

cd "$APP_DIR"

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

echo "[*] Starting the $SERVICE_NAME service..."
sudo systemctl restart "$SERVICE_NAME"

echo "[✓] Install complete. TuneHub service is running."
