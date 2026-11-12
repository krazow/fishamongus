// Fishamongus! Setup: installs the app for the current Windows user (no admin needed),
// adds Start menu and desktop shortcuts, and registers it in Settings → Apps for uninstalling.
package main

import (
	_ "embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"fishamongus/win/internal/win"
)

//go:embed payload/Fishamongus.exe
var appExe []byte

//go:embed payload/fishamongus.ico
var appIcon []byte

var version = "dev" // set at build time

func main() {
	silent := false
	for _, a := range os.Args[1:] {
		if s := strings.ToLower(a); s == "/s" || s == "--silent" {
			silent = true
		}
	}
	dir := win.InstallDir()
	exe := filepath.Join(dir, win.ExeName)
	_, err := os.Stat(exe)
	update := err == nil

	if !silent {
		head, body, yes := "Install Fishamongus! "+version+"?",
			"Fishamongus! is a fishing log: what you caught, where, on what, and in what conditions.\n\n"+
				"It's installed for you only (no administrator needed), with shortcuts in the Start menu and on the desktop. "+
				"Your log stays on this computer. It opens in its own Microsoft Edge app window and needs an internet connection only for weather, tides and maps.",
			"Install"
		if update {
			head, body, yes = "Update Fishamongus! to "+version+"?",
				"Your fishing log on this computer is kept. If Fishamongus! is open, it picks up the update the next time you open it.",
				"Update"
		}
		if !win.Ask(head, body, yes, "Cancel") {
			return
		}
	}

	if err := install(dir, exe); err != nil {
		win.Fail("Fishamongus! couldn't be installed", err.Error())
	}

	if silent {
		return
	}
	head := "Fishamongus! is installed"
	if update {
		head = "Fishamongus! is up to date"
	}
	if win.Ask(head,
		"Open it from the Start menu or the desktop shortcut. To remove it later: Settings → Apps → Installed apps → Fishamongus! → Uninstall.\n\n"+
			"Moving your log from your phone or another app? Make a backup or a spreadsheet (CSV) there, then use Settings → Import a log here, or drop the file onto the Fishamongus! window.",
		"Open Fishamongus!", "Close") {
		c := exec.Command(exe)
		c.Dir = dir
		_ = c.Start()
	}
}

func install(dir, exe string) error {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	// A running copy can't be overwritten, but it can be renamed out of the way.
	old := exe + ".old"
	_ = os.Remove(old)
	if _, err := os.Stat(exe); err == nil {
		if err := os.Rename(exe, old); err != nil {
			return fmt.Errorf("close Fishamongus! and try again (%v)", err)
		}
	}
	tmp := exe + ".new"
	if err := os.WriteFile(tmp, appExe, 0o755); err != nil {
		return err
	}
	if err := os.Rename(tmp, exe); err != nil {
		return err
	}
	_ = os.Remove(old) // fails quietly if the old copy is still running; the next update removes it
	icon := filepath.Join(dir, "fishamongus.ico")
	if err := os.WriteFile(icon, appIcon, 0o644); err != nil {
		return err
	}
	_ = os.MkdirAll(filepath.Dir(win.StartMenuLink()), 0o755)
	if err := win.Shortcut(win.StartMenuLink(), exe, icon, "Your fishing log"); err != nil {
		return fmt.Errorf("couldn't make the Start menu shortcut: %v", err)
	}
	_ = win.Shortcut(win.DesktopLink(), exe, icon, "Your fishing log")

	size := (len(appExe) + len(appIcon)) / 1024
	for _, v := range [][3]string{
		{"DisplayName", "REG_SZ", win.AppName},
		{"DisplayVersion", "REG_SZ", version},
		{"Publisher", "REG_SZ", win.Publisher},
		{"DisplayIcon", "REG_SZ", icon},
		{"InstallLocation", "REG_SZ", dir},
		{"UninstallString", "REG_SZ", `"` + exe + `" --uninstall`},
		{"URLInfoAbout", "REG_SZ", "https://krazow.github.io/fishamongus/"},
		{"InstallDate", "REG_SZ", time.Now().Format("20060102")},
		{"EstimatedSize", "REG_DWORD", fmt.Sprint(size)},
		{"NoModify", "REG_DWORD", "1"},
		{"NoRepair", "REG_DWORD", "1"},
	} {
		if err := win.RegSet(v[0], v[1], v[2]); err != nil {
			return fmt.Errorf("couldn't register the uninstaller: %v", err)
		}
	}
	// "Open with → Fishamongus!" for spreadsheets and backups (it doesn't become the default app for them).
	cmd := `"` + exe + `" "%1"`
	_ = win.Hidden("reg.exe", "add", win.OpenWithKey, "/v", "FriendlyAppName", "/t", "REG_SZ", "/d", win.AppName, "/f")
	_ = win.Hidden("reg.exe", "add", win.OpenWithKey+`\shell\open\command`, "/ve", "/t", "REG_SZ", "/d", cmd, "/f")
	_ = win.Hidden("reg.exe", "add", win.OpenWithKey+`\DefaultIcon`, "/ve", "/t", "REG_SZ", "/d", icon, "/f")
	for _, ext := range []string{".csv", ".json"} {
		_ = win.Hidden("reg.exe", "add", win.OpenWithKey+`\SupportedTypes`, "/v", ext, "/t", "REG_SZ", "/d", "", "/f")
		_ = win.Hidden("reg.exe", "add", `HKCU\Software\Classes\`+ext+`\OpenWithList\`+win.ExeName, "/f")
	}
	return nil
}
