//go:build windows

package bridge

import (
	"os/exec"
	"syscall"
)

func HideExecWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
