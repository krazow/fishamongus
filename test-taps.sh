. ./tap.sh
tap_text "Log"; sleep 3; adb exec-out screencap -p > out/3-log.png
tap_text "Spots"; sleep 3; adb exec-out screencap -p > out/4-spots.png
tap_text "Map"; sleep 8; adb exec-out screencap -p > out/5-map-offline.png
adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1; adb pull /sdcard/ui.xml out/ui-map.xml || true
