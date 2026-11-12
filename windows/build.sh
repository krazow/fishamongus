#!/bin/sh
# Builds dist/FishamongusSetup.exe from the web app in $SRC.
set -e
SRC=${SRC:-$(cd "$(dirname "$0")/.." && pwd)}
cd "$(dirname "$0")"
VER=$(grep -o "APP_VERSION = '[0-9.]*" "$SRC/app.js" | grep -o "[0-9.]*$")
FV=$(echo "$VER.0.0.0" | cut -d. -f1-4)
rm -rf app/web setup/payload dist && mkdir -p app/web/icons setup/payload dist
cp "$SRC"/index.html "$SRC"/app.js "$SRC"/styles.css "$SRC"/sw.js "$SRC"/manifest.webmanifest app/web/
cp "$SRC"/icons/* app/web/icons/
python3 tools/mkrsrc.py tools/fishamongus.ico app/rsrc_windows_amd64.syso "Fishamongus!" "$FV"
python3 tools/mkrsrc.py tools/fishamongus.ico setup/rsrc_windows_amd64.syso "Fishamongus! Setup" "$FV" "Fishamongus! Setup"
export GOOS=windows GOARCH=amd64 CGO_ENABLED=0
go vet ./app ./internal/...
go build -trimpath -ldflags "-s -w -H=windowsgui -X main.version=$VER" -o setup/payload/Fishamongus.exe ./app
cp tools/fishamongus.ico setup/payload/
go vet ./setup
go build -trimpath -ldflags "-s -w -H=windowsgui -X main.version=$VER" -o "dist/FishamongusSetup-$VER.exe" ./setup
ls -la dist setup/payload
