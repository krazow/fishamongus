# Past the welcome screen (sample data), back to Now, then scroll through it.
. ./tap.sh
tap_text "Look around with sample data first"; sleep 4
tap_text "Now"; sleep 12
adb exec-out screencap -p > out/6-now-online.png
adb shell input swipe 540 1800 540 700 400; sleep 2; adb exec-out screencap -p > out/7-now-2.png
adb shell input swipe 540 1800 540 700 400; sleep 2; adb exec-out screencap -p > out/8-now-3.png
adb shell input swipe 540 1800 540 700 400; sleep 2; adb exec-out screencap -p > out/9-now-4.png
tap_text "Spots"; sleep 2; tap_text "Map"; sleep 10; adb exec-out screencap -p > out/10-map-online.png
