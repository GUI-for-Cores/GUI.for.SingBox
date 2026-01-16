//go:build windows

package bridge

import (
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

const ATTACH_PARENT_PROCESS uintptr = ^uintptr(0)

var (
	modAdvapi32 = windows.NewLazySystemDLL("advapi32.dll")
	modKernel32 = windows.NewLazySystemDLL("kernel32.dll")

	procCheckTokenMembership     = modAdvapi32.NewProc("CheckTokenMembership")
	procFreeConsole              = modKernel32.NewProc("FreeConsole")
	procAttachConsole            = modKernel32.NewProc("AttachConsole")
	procSetConsoleCtrlHandler    = modKernel32.NewProc("SetConsoleCtrlHandler")
	procGenerateConsoleCtrlEvent = modKernel32.NewProc("GenerateConsoleCtrlEvent")
)

func SetCmdWindowHidden(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: windows.CREATE_UNICODE_ENVIRONMENT | windows.CREATE_NEW_PROCESS_GROUP,
		HideWindow:    true,
	}
}

func SendExitSignal(p *os.Process) error {
	if ret, _, err := procFreeConsole.Call(); ret == 0 && err != windows.ERROR_INVALID_HANDLE {
		return err
	}

	defer func() {
		procAttachConsole.Call(ATTACH_PARENT_PROCESS)
	}()

	if ret, _, err := procAttachConsole.Call(uintptr(p.Pid)); ret == 0 && err != windows.ERROR_ACCESS_DENIED {
		return err
	}

	if ret, _, err := procSetConsoleCtrlHandler.Call(0, 1); ret == 0 {
		return err
	}

	if ret, _, err := procGenerateConsoleCtrlEvent.Call(windows.CTRL_BREAK_EVENT, uintptr(p.Pid)); ret == 0 {
		return err
	}

	return nil
}

func IsProcessAlive(p *os.Process) (bool, error) {
	h, err := windows.OpenProcess(windows.SYNCHRONIZE, false, uint32(p.Pid))
	if err != nil {
		if err == windows.ERROR_INVALID_PARAMETER {
			return false, nil
		}
		return false, err
	}
	defer windows.CloseHandle(h)

	s, err := windows.WaitForSingleObject(h, 0)
	if err != nil {
		return false, err
	}
	switch s {
	case windows.WAIT_OBJECT_0:
		return false, nil
	case uint32(windows.WAIT_TIMEOUT):
		return true, nil
	default:
		return false, fmt.Errorf("unexpected WaitForSingleObject status: %d", s)
	}
}

func IsPrivileged() (bool, error) {
	var sid *windows.SID
	sid, err := windows.CreateWellKnownSid(windows.WinBuiltinAdministratorsSid)
	if err != nil {
		return false, err
	}

	var isMember int32

	ret, _, err := procCheckTokenMembership.Call(0, uintptr(unsafe.Pointer(sid)), uintptr(unsafe.Pointer(&isMember)))
	if ret == 0 {
		return false, err
	}

	return isMember != 0, nil
}
