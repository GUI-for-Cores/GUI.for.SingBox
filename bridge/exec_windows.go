//go:build windows

package bridge

import (
	"errors"
	"fmt"
	"log"
	"math"
	"os"
	"os/exec"
	"slices"
	"strings"
	"syscall"
	"unicode/utf16"
	"unicode/utf8"
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
	procGetOEMCP                 = modKernel32.NewProc("GetOEMCP")
)

func DecodeCommandOutput(data []byte) string {
	if len(data) == 0 {
		return ""
	}
	if utf8.Valid(data) {
		return string(data)
	}

	codePage, _, _ := procGetOEMCP.Call()
	if codePage == 0 || codePage > math.MaxUint32 {
		return string(data)
	}
	if len(data) > math.MaxInt32 {
		return string(data)
	}

	length, err := windows.MultiByteToWideChar(uint32(codePage), 0, &data[0], int32(len(data)), nil, 0)
	if err != nil {
		return string(data)
	}

	wide := make([]uint16, length)
	length, err = windows.MultiByteToWideChar(uint32(codePage), 0, &data[0], int32(len(data)), &wide[0], length)
	if err != nil {
		return string(data)
	}

	return string(utf16.Decode(wide[:length]))
}

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

func startApp(path string, args []string, admin bool) error {
	cmd := exec.Command(path, args...)
	SetCmdWindowHidden(cmd)
	if !admin && Env.IsPrivileged {
		// Start as a child of the shell to get its unelevated token, without the
		// __COMPAT_LAYER=RunAsAdmin we inherited from being started as administrator
		cmd.Env = slices.DeleteFunc(os.Environ(), func(e string) bool {
			return strings.HasPrefix(strings.ToUpper(e), "__COMPAT_LAYER=")
		})
		var pid uint32
		windows.GetWindowThreadProcessId(windows.GetShellWindow(), &pid)
		shell, err := windows.OpenProcess(windows.PROCESS_CREATE_PROCESS|windows.PROCESS_DUP_HANDLE, false, pid)
		if err == nil {
			defer windows.CloseHandle(shell)
			cmd.SysProcAttr.ParentProcess = syscall.Handle(shell)
			err = cmd.Start()
		}
		log.Printf("Restart unelevated under shell process %d: %v", pid, err)
		return err
	}
	if !admin || Env.IsPrivileged {
		// ERROR_ELEVATION_REQUIRED: the exe is set to run as administrator
		if err := cmd.Start(); !errors.Is(err, windows.ERROR_ELEVATION_REQUIRED) {
			return err
		}
	}
	return windows.ShellExecute(0, windows.StringToUTF16Ptr("runas"), windows.StringToUTF16Ptr(path),
		windows.StringToUTF16Ptr(windows.ComposeCommandLine(args)), nil, windows.SW_SHOWNORMAL)
}

func waitForExit(pid int) {
	h, err := windows.OpenProcess(windows.SYNCHRONIZE, false, uint32(pid))
	if err != nil {
		return
	}
	defer windows.CloseHandle(h)
	windows.WaitForSingleObject(h, 10_000)
}
