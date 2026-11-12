//go:build windows

// Package win holds the small Windows helpers both programs share: dialogs, paths, shortcuts and the registry.
package win

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"unsafe"
)

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	comctl32 = syscall.NewLazyDLL("comctl32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")
	shell32  = syscall.NewLazyDLL("shell32.dll")
)

func u16(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }

const (
	MB_OK           = 0x0
	MB_YESNO        = 0x4
	MB_ICONERROR    = 0x10
	MB_ICONQUESTION = 0x20
	MB_ICONINFO     = 0x40
	IDYES           = 6
)

// Ask shows a Yes / No dialog with the app's icon and returns true for Yes.
// head is the bold first line, body the text under it.
func Ask(head, body, yes, no string) bool {
	if r, ok := taskDialog(head, body, yes, no); ok {
		return r
	}
	return msgBox(head+"\n\n"+body, MB_YESNO|MB_ICONQUESTION) == IDYES
}

// Tell shows a message with an OK button.
func Tell(head, body string) {
	if _, ok := taskDialog(head, body, "", ""); ok {
		return
	}
	msgBox(head+"\n\n"+body, MB_OK|MB_ICONINFO)
}

// Fail shows an error and exits.
func Fail(head, body string) {
	msgBox(head+"\n\n"+body, MB_OK|MB_ICONERROR)
	os.Exit(1)
}

func msgBox(text string, flags uintptr) int {
	r, _, _ := user32.NewProc("MessageBoxW").Call(0, uintptr(unsafe.Pointer(u16(text))), uintptr(unsafe.Pointer(u16(AppName))), flags)
	return int(r)
}

// TaskDialogIndirect: TASKDIALOGCONFIG and TASKDIALOG_BUTTON are 1-byte packed in commctrl.h,
// so they are laid out by hand (64-bit offsets).
func put32(b []byte, off int, v uint32) { *(*uint32)(unsafe.Pointer(&b[off])) = v }
func putP(b []byte, off int, v uintptr) { *(*uintptr)(unsafe.Pointer(&b[off])) = v }

func taskDialog(head, body, yes, no string) (bool, bool) {
	proc := comctl32.NewProc("TaskDialogIndirect")
	if proc.Find() != nil {
		return false, false
	}
	hinst, _, _ := kernel32.NewProc("GetModuleHandleW").Call(0)
	title, h, c, y, n := u16(AppName), u16(head), u16(body), u16(yes), u16(no)
	cfg := make([]byte, 160)
	btn := make([]byte, 24)
	put32(cfg, 0, 160)
	putP(cfg, 12, hinst)
	put32(cfg, 20, 0x0008|0x1000) // allow cancel, position relative to window
	putP(cfg, 28, uintptr(unsafe.Pointer(title)))
	putP(cfg, 36, 1) // our icon group, resource ID 1
	putP(cfg, 44, uintptr(unsafe.Pointer(h)))
	putP(cfg, 52, uintptr(unsafe.Pointer(c)))
	if yes != "" {
		put32(btn, 0, 100)
		putP(btn, 4, uintptr(unsafe.Pointer(y)))
		put32(btn, 12, 101)
		putP(btn, 16, uintptr(unsafe.Pointer(n)))
		put32(cfg, 60, 2)
		putP(cfg, 64, uintptr(unsafe.Pointer(&btn[0])))
		put32(cfg, 72, 100)
	} else {
		put32(cfg, 24, 1) // OK button
	}
	var pressed int32
	r, _, _ := proc.Call(uintptr(unsafe.Pointer(&cfg[0])), uintptr(unsafe.Pointer(&pressed)), 0, 0)
	runtime.KeepAlive(title)
	runtime.KeepAlive(h)
	runtime.KeepAlive(c)
	runtime.KeepAlive(y)
	runtime.KeepAlive(n)
	runtime.KeepAlive(btn)
	if r != 0 {
		return false, false
	}
	return pressed == 100, true
}

// Hidden runs a command with no console window and waits for it.
func Hidden(name string, args ...string) error {
	c := exec.Command(name, args...)
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	return c.Run()
}

func LocalAppData() string {
	if p := os.Getenv("LOCALAPPDATA"); p != "" {
		return p
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, "AppData", "Local")
}

func InstallDir() string { return filepath.Join(LocalAppData(), "Programs", "Fishamongus") }
func DataDir() string    { return filepath.Join(LocalAppData(), "Fishamongus") }

func StartMenuLink() string {
	return filepath.Join(os.Getenv("APPDATA"), `Microsoft\Windows\Start Menu\Programs`, AppName+".lnk")
}

func DesktopLink() string {
	// The real Desktop folder (it may be moved to OneDrive).
	var p *uint16
	fid := syscall.GUID{Data1: 0xB4BFCC3A, Data2: 0xDB2C, Data3: 0x424C, Data4: [8]byte{0xB0, 0x29, 0x7F, 0xE9, 0x9A, 0x87, 0xC6, 0x41}}
	proc := shell32.NewProc("SHGetKnownFolderPath")
	if proc.Find() == nil {
		if r, _, _ := proc.Call(uintptr(unsafe.Pointer(&fid)), 0, 0, uintptr(unsafe.Pointer(&p))); r == 0 && p != nil {
			d := syscall.UTF16ToString((*[1 << 15]uint16)(unsafe.Pointer(p))[:])
			syscall.NewLazyDLL("ole32.dll").NewProc("CoTaskMemFree").Call(uintptr(unsafe.Pointer(p)))
			return filepath.Join(d, AppName+".lnk")
		}
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, "Desktop", AppName+".lnk")
}

func psQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

// Shortcut makes a .lnk with PowerShell's WScript.Shell (no extra libraries).
func Shortcut(link, target, icon, desc string) error {
	ps := "$s=(New-Object -ComObject WScript.Shell).CreateShortcut(" + psQuote(link) + ");" +
		"$s.TargetPath=" + psQuote(target) + ";$s.WorkingDirectory=" + psQuote(filepath.Dir(target)) + ";" +
		"$s.IconLocation=" + psQuote(icon+",0") + ";$s.Description=" + psQuote(desc) + ";$s.Save()"
	return Hidden("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps)
}

func RegSet(name, typ, val string) error {
	return Hidden("reg.exe", "add", UninstKey, "/v", name, "/t", typ, "/d", val, "/f")
}
