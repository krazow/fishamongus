// Package win holds the small Windows helpers both programs share.
package win

const (
	AppName   = "Fishamongus!"
	ExeName   = "Fishamongus.exe"
	Publisher = "krazow"
	Port      = 47812 // fixed, so the log (stored per web address) is always found again
	UninstKey = `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Fishamongus`
)
