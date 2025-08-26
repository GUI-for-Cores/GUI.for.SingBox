//go:build !windows

package bridge

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"syscall"
)

func SetCmdWindowHidden(cmd *exec.Cmd) {
}

func SendExitSignal(p *os.Process) error {
	return p.Signal(syscall.SIGINT)
}

func IsProcessAlive(p *os.Process) (bool, error) {
	err := p.Signal(syscall.Signal(0))
	if err == nil {
		return true, nil
	}
	if errors.Is(err, os.ErrProcessDone) {
		return false, nil
	}
	if errno, ok := err.(syscall.Errno); ok {
		switch errno {
		case syscall.ESRCH:
			return false, nil
		case syscall.EPERM:
			return true, nil
		}
	}
	return false, fmt.Errorf("failed to check process %d: %w", p.Pid, err)
}
