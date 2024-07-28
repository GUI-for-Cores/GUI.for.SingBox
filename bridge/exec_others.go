//go:build !windows

package bridge

import (
	"os"
	"os/exec"
	"syscall"
)

func HideExecWindow(cmd *exec.Cmd) {
}

func KillProcessImpl(process *os.Process) error {
	return process.Signal(syscall.SIGINT)
}
