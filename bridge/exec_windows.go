//go:build windows

package bridge

import (
	"os"
	"os/exec"
	"syscall"

	"golang.org/x/sys/windows"
)

func HideExecWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: windows.CREATE_UNICODE_ENVIRONMENT | windows.CREATE_NEW_PROCESS_GROUP,
		HideWindow:    true,
	}
}

func SendExitSignal(p *os.Process) error {
	kernel32DLL, err := windows.LoadDLL("kernel32.dll")
	if err != nil {
		return err
	}
	defer kernel32DLL.Release()

	freeConsoleProc, err := kernel32DLL.FindProc("FreeConsole")
	if err == nil {
		if result, _, err := freeConsoleProc.Call(); result == 0 {
			if err != windows.ERROR_INVALID_HANDLE {
				return err
			}
		}
	}

	attachConsoleProc, err := kernel32DLL.FindProc("AttachConsole")
	if err != nil {
		return err
	}
	if result, _, err := attachConsoleProc.Call(uintptr(p.Pid)); result == 0 {
		if err != windows.ERROR_ACCESS_DENIED {
			return err
		}
	}

	setConsoleCtrlHandlerProc, err := kernel32DLL.FindProc("SetConsoleCtrlHandler")
	if err != nil {
		return err
	}
	if result, _, err := setConsoleCtrlHandlerProc.Call(0, 1); result == 0 {
		return err
	}

	generateConsoleCtrlEventProc, err := kernel32DLL.FindProc("GenerateConsoleCtrlEvent")
	if err != nil {
		return err
	}
	if result, _, err := generateConsoleCtrlEventProc.Call(windows.CTRL_BREAK_EVENT, uintptr(p.Pid)); result == 0 {
		return err
	}

	return nil
}
