#!/usr/bin/env bash
# Builds Fishamongus! for Android for the release kit (github.com/krazow/release-kit), once per channel.
# The kit sets CHANNEL (beta|prod), VERSION, LABEL, WWW (this channel's built web app) and OUT.
# Signing uses the repo secrets ANDROID_KEYSTORE_B64 / ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS (passed in as
# KS_B64 / KS_PASS / KS_ALIAS). Fishamongus! APKs are already signed with a real key, so without it no APK is
# built: one signed with any other key couldn't update the app on people's phones.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
if [ -z "${KS_B64:-}" ]; then
  echo "::warning::Fishamongus! Android: no signing key in the repo secrets, so no APK this time (see android/build-release.sh)."
  exit 0
fi
# The map library goes inside the app, so maps work offline from the first launch.
if [ ! -f /tmp/leaflet/package/dist/leaflet.js ]; then
  mkdir -p /tmp/leaflet && (cd /tmp/leaflet && npm pack leaflet@1.9.4 --silent && tar xzf leaflet-1.9.4.tgz)
fi
W="$ROOT/android/app/src/main/assets/www"
rm -rf "$W" && mkdir -p "$W/vendor/leaflet"
cp -r "$WWW"/. "$W/" && rm -rf "$W/demo"
cp -r /tmp/leaflet/package/dist/* "$W/vendor/leaflet/"
sed -i "s#https://unpkg.com/leaflet@1.9.4/dist/#vendor/leaflet/#" "$W/app.js"
BETA=false; NAME="Fishamongus-$LABEL.apk"
if [ "$CHANNEL" = beta ]; then BETA=true; NAME="Fishamongus-Beta-$LABEL.apk"; fi
(cd "$ROOT/android" && gradle --no-daemon --console=plain assembleRelease -PversionName="$LABEL" -Pbeta=$BETA -PwebDir="$WWW")
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$BT/zipalign" -f -p 4 "$ROOT/android/app/build/outputs/apk/release/app-release-unsigned.apk" /tmp/fa-aligned.apk
echo "$KS_B64" | base64 -d > /tmp/fa.ks
"$BT/apksigner" sign --ks /tmp/fa.ks --ks-pass env:KS_PASS --ks-key-alias "$KS_ALIAS" --out "$OUT/$NAME" /tmp/fa-aligned.apk
rm -f /tmp/fa.ks
"$BT/apksigner" verify --print-certs "$OUT/$NAME" | tee /tmp/fa-verify.txt
# Must be the key that signed every release so far (4.9.3 and earlier), or the APK won't install over people's app.
EXPECTED_CERT=941c7276419e8e131db99bba49564556e2f5cc8953df7985171a5a893b3c3335
if ! grep -qi "certificate SHA-256 digest: $EXPECTED_CERT" /tmp/fa-verify.txt; then
  echo "::error::Fishamongus! Android: signed with a different key than earlier releases. Check the ANDROID_KEYSTORE_B64 secret."
  rm -f "$OUT/$NAME"; exit 1
fi
rm -rf "$ROOT/android/app/build"
