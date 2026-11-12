//go:build !windows

package win

import (
	"fmt"
	"os"
	"path/filepath"
)

// Stand-ins so the app can be built and tested off Windows.
func Ask(head, body, yes, no string) bool      { fmt.Println(head, body); return false }
func Tell(head, body string)                   { fmt.Println(head, body) }
func Fail(head, body string)                   { fmt.Println(head, body); os.Exit(1) }
func Hidden(name string, args ...string) error { return nil }
func DataDir() string                          { return filepath.Join(os.TempDir(), "Fishamongus") }
func InstallDir() string                       { return filepath.Join(os.TempDir(), "FishamongusApp") }
func StartMenuLink() string                    { return "" }
func DesktopLink() string                      { return "" }
