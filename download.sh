#!/bin/bash
set -e

REPO="Sumis34/tunehub"
VERSION="$1"

if [ -z "$VERSION" ]; then
  echo "[!] No version specified"
  echo "Usage: curl ... | bash -s vX.Y.Z"
  exit 1
fi

INSTALL_TMP="/tmp/tunehub-install"
ZIP_NAME="tunehub-${VERSION}.zip"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ZIP_NAME}"

echo "[*] Installing TuneHub ${VERSION}"
echo "[*] Downloading ${DOWNLOAD_URL}"

rm -rf "$INSTALL_TMP"
mkdir -p "$INSTALL_TMP"

curl -fL "$DOWNLOAD_URL" -o "$INSTALL_TMP/$ZIP_NAME"

echo "[*] Extracting..."
unzip -q "$INSTALL_TMP/$ZIP_NAME" -d "$INSTALL_TMP"

cd "$INSTALL_TMP"

echo "[*] Running setup..."
chmod +x install.sh
./install.sh

echo "[✓] TuneHub ${VERSION} installed"
