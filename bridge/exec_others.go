//go:build !windows

package bridge

import (
	"os"
	"os/exec"
	"syscall"
)

func SetCmdWindowHidden(cmd *exec.Cmd) {
}

func SendExitSignal(process *os.Process) error {
	return process.Signal(syscall.SIGINT)
}
