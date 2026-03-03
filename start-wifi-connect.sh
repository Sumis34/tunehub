#!/bin/bash
set -euo pipefail

if nm-online -q -t 10; then
  exit 0
fi

exec wifi-connect --portal-ssid "TuneHub Setup"
