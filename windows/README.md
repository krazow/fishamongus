# Fishamongus! for Windows

`build.sh` turns the web app in the folder above into `dist/FishamongusSetup-<version>.exe`, using only Go's standard library (Go 1.24+, Python 3 and ImageMagick were used to make the icon).

- **Fishamongus.exe** serves the app's own files on `127.0.0.1:47812` and opens them in a Microsoft Edge app window (Chrome if Edge is missing). The window uses its own profile in `%LOCALAPPDATA%\Fishamongus`, so the log is separate from your normal browser. The port is fixed because the log is tied to that address.
- **FishamongusSetup.exe** installs it for the current user in `%LOCALAPPDATA%\Programs\Fishamongus` (no administrator needed), adds Start menu and desktop shortcuts, and registers it under Settings → Apps for uninstalling. Running a newer setup updates it and keeps the log. `/S` installs silently.
- Uninstalling asks whether to keep the fishing log on the computer.

The exe files aren't code-signed, so Windows SmartScreen shows "Windows protected your PC" the first time: choose **More info → Run anyway**.
