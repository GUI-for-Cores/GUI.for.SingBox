//go:build windows

package bridge

import (
	"fmt"
	"os/exec"
	"syscall"
)

func (a *App) QuerySchTask(taskName string) FlagResult {
	fmt.Println("QuerySchTask:", taskName)

	cmd := exec.Command("Schtasks", "/Query", "/TN", taskName, "/XML")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, ConvertByte2String(out)}
	}

	return FlagResult{true, ConvertByte2String(out)}
}

func (a *App) CreateSchTask(taskName string, xmlPath string) FlagResult {
	fmt.Println("CreateSchTask:", taskName, xmlPath)

	xmlPath, err := GetPath(xmlPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	cmd := exec.Command("SchTasks", "/Create", "/F", "/TN", taskName, "/XML", xmlPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, ConvertByte2String(out)}
	}

	return FlagResult{true, ConvertByte2String(out)}
}

func (a *App) DeleteSchTask(taskName string) FlagResult {
	fmt.Println("DeleteSchTask:", taskName)

	cmd := exec.Command("SchTasks", "/Delete", "/F", "/TN", taskName)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, ConvertByte2String(out)}
	}

	return FlagResult{true, ConvertByte2String(out)}
}
