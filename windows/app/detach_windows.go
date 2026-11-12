package main

import (
	"os/exec"
	"syscall"
)

// startDetached runs a raw command line (cmd.exe quoting, not Go's) with no window.
func startDetached(cmdline string) error {
	c := exec.Command("cmd.exe")
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CmdLine: cmdline, CreationFlags: 0x08000000}
	return c.Start()
}
