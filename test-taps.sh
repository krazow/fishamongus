# Taps through the app using the UI tree: open Log, then Spots, then the map.
tap_text() {
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1; adb pull /sdcard/ui.xml /tmp/ui.xml > /dev/null 2>&1
  b=$(python3 - "$1" <<'PY'
import re,sys
x=open('/tmp/ui.xml',encoding='utf-8').read(); t=sys.argv[1]
for m in re.finditer(r'<node [^>]*>', x):
    n=m.group(0)
    if (f'text="{t}"' in n or f'content-desc="{t}"' in n):
        b=re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', n)
        if b:
            x1,y1,x2,y2=map(int,b.groups()); print((x1+x2)//2,(y1+y2)//2); break
PY
)
  if [ -n "$b" ]; then adb shell input tap $b; echo "tapped $1 at $b"; else echo "not found: $1"; fi
}
tap_text "Log"; sleep 3; adb exec-out screencap -p > out/3-log.png
tap_text "Spots"; sleep 3; adb exec-out screencap -p > out/4-spots.png
tap_text "Map"; sleep 8; adb exec-out screencap -p > out/5-map-offline.png
adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1; adb pull /sdcard/ui.xml out/ui-map.xml || true
