#!/usr/bin/env bash
# Builds the Fishamongus! Windows installer for the release kit (production only: the beta is the web /beta/ address,
# because the installer's fixed port and folder tie it to the real fishing log).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
if [ ! -f /tmp/leaflet/package/dist/leaflet.js ]; then
  mkdir -p /tmp/leaflet && (cd /tmp/leaflet && npm pack leaflet@1.9.4 --silent && tar xzf leaflet-1.9.4.tgz)
fi
SRC="$WWW" LEAFLET_DIR=/tmp/leaflet/package/dist sh "$ROOT/windows/build.sh"
cp "$ROOT"/windows/dist/FishamongusSetup-*.exe "$OUT/"
