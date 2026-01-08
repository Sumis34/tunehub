#!/bin/bash

cd /opt/tunehub

export DISPLAY=:0

/opt/tunehub/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!

sleep 2

chromium http://localhost:8000 \
    --kiosk \
    --start-fullscreen \
    --disable-pinch \
    --incognito \
    --disable-gpu \
    --disable-software-rasterizer \
    --disable-extensions &

wait $SERVER_PID
