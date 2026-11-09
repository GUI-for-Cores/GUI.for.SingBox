//go:build !windows

package bridge

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"time"
)

func DecodeCommandOutput(data []byte) string {
	return string(data)
}

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

func IsPrivileged() (bool, error) {
	return os.Geteuid() == 0, nil
}

func startApp(path string, args []string, admin bool) error {
	return exec.Command(path, args...).Start()
}

func waitForExit(pid int) {
	// Polling the parent pid rather than pid itself is immune to the zombie state
	for deadline := time.Now().Add(10 * time.Second); pid > 0 && os.Getppid() == pid && time.Now().Before(deadline); {
		time.Sleep(50 * time.Millisecond)
	}
}
