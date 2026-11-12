// Fishamongus! for Windows: serves the app's own files on this computer and opens them
// in an Edge (or Chrome) app window. The log is kept in that window's own profile under
// %LOCALAPPDATA%\Fishamongus, separate from your normal browser.
package main

import (
	"crypto/rand"
	"embed"
	"encoding/hex"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net"
	"net/http"
	neturl "net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"fishamongus/win/internal/win"
)

//go:embed web
var webFiles embed.FS

var version = "dev" // set at build time

const marker = "/__fishamongus"

func main() {
	for _, a := range os.Args[1:] {
		switch strings.ToLower(a) {
		case "--uninstall", "/uninstall":
			uninstall()
			return
		case "--version":
			fmt.Println(version)
			return
		}
	}
	addr := fmt.Sprintf("127.0.0.1:%d", win.Port)
	url := "http://" + addr + "/"
	// A log file opened with the app (dragged onto the shortcut, or Open with) goes to the importer.
	if f := fileArg(); f != "" {
		if tok := offerFile(addr, f); tok != "" {
			url += "?import=" + tok
		}
	}

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		// Already running? Then just open another window on it.
		if alreadyOurs(addr) {
			if b := browser(); b != "" {
				_ = launch(b, url).Start()
			} else {
				openDefault(url)
			}
			return
		}
		win.Fail("Fishamongus! can't start",
			fmt.Sprintf("Another program is using port %d on this computer, which Fishamongus! needs. Close that program and try again.", win.Port))
	}

	go func() { _ = http.Serve(ln, handler()) }()

	b := browser()
	if b == "" {
		// No Edge or Chrome: use the default browser and stay up for a while.
		openDefault(url)
		time.Sleep(12 * time.Hour)
		return
	}
	cmd := launch(b, url)
	if err := cmd.Start(); err != nil {
		win.Fail("Fishamongus! can't open its window", err.Error())
	}
	_ = cmd.Wait() // the window's browser process ends when the last Fishamongus! window closes
	// Give a quick reopen (or the browser handing off to itself) a moment before shutting down.
	time.Sleep(3 * time.Second)
}

func handler() http.Handler {
	sub, _ := fs.Sub(webFiles, "web")
	_ = mime.AddExtensionType(".webmanifest", "application/manifest+json")
	_ = mime.AddExtensionType(".js", "text/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".svg", "image/svg+xml")
	files := http.FileServer(http.FS(sub))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == marker {
			fmt.Fprint(w, "fishamongus "+version)
			return
		}
		if r.URL.Path == marker+"/offer" && r.Method == http.MethodPost && isLocal(r) {
			// Another copy of the app hands over a file to import.
			b, err := io.ReadAll(io.LimitReader(r.Body, maxImport+1))
			if err != nil || len(b) > maxImport {
				http.Error(w, "too big", http.StatusRequestEntityTooLarge)
				return
			}
			fmt.Fprint(w, keep(r.URL.Query().Get("name"), b))
			return
		}
		if strings.HasPrefix(r.URL.Path, "/__open/") {
			name, b, ok := take(strings.TrimPrefix(r.URL.Path, "/__open/"))
			if !ok {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Header().Set("X-File-Name", neturl.PathEscape(name))
			w.Header().Set("Cache-Control", "no-store")
			_, _ = w.Write(b)
			return
		}
		if strings.Contains(r.URL.Path, "/demo/") {
			http.Redirect(w, r, "https://krazow.github.io/fishamongus/demo/", http.StatusFound)
			return
		}
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		files.ServeHTTP(w, r)
	})
}

func alreadyOurs(addr string) bool {
	c := http.Client{Timeout: 2 * time.Second}
	r, err := c.Get("http://" + addr + marker)
	if err != nil {
		return false
	}
	defer r.Body.Close()
	buf := make([]byte, 32)
	n, _ := r.Body.Read(buf)
	return strings.HasPrefix(string(buf[:n]), "fishamongus")
}

func browser() string {
	var c []string
	for _, env := range []string{"ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"} {
		if d := os.Getenv(env); d != "" {
			c = append(c, filepath.Join(d, `Microsoft\Edge\Application\msedge.exe`))
		}
	}
	for _, env := range []string{"ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"} {
		if d := os.Getenv(env); d != "" {
			c = append(c, filepath.Join(d, `Google\Chrome\Application\chrome.exe`))
		}
	}
	for _, p := range c {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}

func launch(browserExe, url string) *exec.Cmd {
	profile := filepath.Join(win.DataDir(), "Browser")
	_ = os.MkdirAll(profile, 0o755)
	return exec.Command(browserExe,
		"--app="+url,
		"--user-data-dir="+profile,
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-features=msEdgeSidebarV2,msUndersideButton",
		"--window-size=1100,900",
	)
}

func openDefault(url string) {
	_ = win.Hidden("rundll32.exe", "url.dll,FileProtocolHandler", url)
}

func uninstall() {
	if !win.Ask("Uninstall Fishamongus!?",
		"This removes the app and its shortcuts from this computer.",
		"Uninstall", "Cancel") {
		return
	}
	keep := !win.Ask("Also delete your fishing log on this computer?",
		"Your catches, spots, trips and settings are stored on this computer. If you choose Delete, they're gone for good, so make a backup first (Settings → Backup) unless you have one.\n\nChoose Keep to leave them here; they come back if you install Fishamongus! again.",
		"Delete my log", "Keep my log")

	_ = win.Hidden("reg.exe", "delete", win.OpenWithKey, "/f")
	for _, ext := range []string{".csv", ".json"} {
		_ = win.Hidden("reg.exe", "delete", `HKCU\Software\Classes\`+ext+`\OpenWithList\`+win.ExeName, "/f")
	}
	_ = os.Remove(win.StartMenuLink())
	_ = os.Remove(win.DesktopLink())
	_ = win.Hidden("reg.exe", "delete", win.UninstKey, "/f")

	if keep {
		win.Tell("Fishamongus! was uninstalled", "Your fishing log was kept on this computer.")
	} else {
		win.Tell("Fishamongus! was uninstalled", "The app and your fishing log were removed from this computer.")
	}
	// This program runs from the folder being removed, so the folder goes a moment after it exits.
	rm := `rmdir /s /q "` + win.InstallDir() + `"`
	if !keep {
		rm += ` & rmdir /s /q "` + win.DataDir() + `"`
	}
	_ = startDetached(`cmd.exe /c "ping -n 3 127.0.0.1 >nul & ` + rm + `"`)
}

// ---- files opened with the app ----

const maxImport = 50 << 20

var (
	offered   = map[string]offer{}
	offeredMu sync.Mutex
)

type offer struct {
	name string
	data []byte
}

// fileArg is the first argument that is an existing .csv, .tsv, .txt or .json file.
func fileArg() string {
	for _, a := range os.Args[1:] {
		if strings.HasPrefix(a, "-") {
			continue
		}
		ext := strings.ToLower(filepath.Ext(a))
		if ext != ".csv" && ext != ".tsv" && ext != ".txt" && ext != ".json" {
			continue
		}
		if st, err := os.Stat(a); err == nil && !st.IsDir() && st.Size() <= maxImport {
			return a
		}
	}
	return ""
}

func keep(name string, b []byte) string {
	t := make([]byte, 16)
	_, _ = rand.Read(t)
	tok := hex.EncodeToString(t)
	offeredMu.Lock()
	offered[tok] = offer{filepath.Base(name), b}
	offeredMu.Unlock()
	return tok
}

// take hands a file over once.
func take(tok string) (string, []byte, bool) {
	offeredMu.Lock()
	defer offeredMu.Unlock()
	o, ok := offered[tok]
	delete(offered, tok)
	return o.name, o.data, ok
}

func isLocal(r *http.Request) bool {
	h, _, _ := net.SplitHostPort(r.RemoteAddr)
	return h == "127.0.0.1" && r.Header.Get("Origin") == ""
}

// offerFile reads the file and returns a one-time token for it: kept here if this copy
// will run the server, or handed to the copy that's already running.
func offerFile(addr, path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	if !alreadyOurs(addr) {
		return keep(path, b)
	}
	c := http.Client{Timeout: 5 * time.Second}
	r, err := c.Post("http://"+addr+marker+"/offer?name="+neturl.QueryEscape(filepath.Base(path)), "application/octet-stream", strings.NewReader(string(b)))
	if err != nil {
		return ""
	}
	defer r.Body.Close()
	tok, _ := io.ReadAll(io.LimitReader(r.Body, 64))
	if r.StatusCode != http.StatusOK {
		return ""
	}
	return string(tok)
}
