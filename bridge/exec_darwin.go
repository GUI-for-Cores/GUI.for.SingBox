//go:build darwin

package bridge

import (
	"os/exec"
)

func HideExecWindow(cmd *exec.Cmd) {
}
