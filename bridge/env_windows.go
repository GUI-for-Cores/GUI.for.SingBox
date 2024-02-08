//go:build windows

package bridge

import (
	"log"
	"net"
	"os/exec"
	"strings"
	"syscall"
)

func (a *App) GetEnv() EnvResult {
	return EnvResult{
		AppName:  Env.AppName,
		BasePath: Env.BasePath,
		OS:       Env.OS,
		ARCH:     Env.ARCH,
	}
}

// Maybe there is a better way
func (a *App) SetSystemProxy(enable bool, server string) FlagResult {
	if enable {
		log.Printf("SetSystemProxy: %s", server)
	} else {
		log.Printf("ClearSystemProxy")
	}

	REG_DWORD, ProxyServer := "0", ""

	if enable {
		REG_DWORD = "1"
		ProxyServer = server
	}

	cmd := exec.Command("reg", "add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", REG_DWORD, "/f")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	cmd = exec.Command("reg", "add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", "/v", "ProxyServer", "/d", ProxyServer, "/f")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err = cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, string(out)}
}

func (a *App) GetSystemProxy() FlagResult {
	log.Printf("GetSystemProxy")

	cmd := exec.Command("reg", "query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	fields := strings.Fields(string(out))

	if len(fields) > 4 && fields[4] == "0x1" {
		cmd = exec.Command("reg", "query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", "/v", "ProxyServer", "/t", "REG_SZ")
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

		out, err = cmd.CombinedOutput()
		if err != nil {
			return FlagResult{false, err.Error()}
		}

		fields := strings.Fields(string(out))

		if len(fields) > 4 {
			return FlagResult{true, fields[4]}
		}

	}

	return FlagResult{true, ""}
}

func (a *App) SwitchPermissions(enable bool, path string) FlagResult {
	log.Printf("SwitchPermissions: %v", enable)

	cmd := exec.Command("reg", "delete", "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers", "/v", path, "/f")

	if enable {
		cmd = exec.Command("reg", "add", "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers", "/v", path, "/t", "REG_SZ", "/d", "RunAsAdmin", "/f")
	}

	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, string(out)}
}

func (a *App) CheckPermissions(path string) FlagResult {
	log.Printf("CheckPermissions")

	cmd := exec.Command("reg", "query", "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers", "/v", path, "/t", "REG_SZ")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	fields := strings.Fields(string(out))

	if len(fields) > 4 {
		return FlagResult{true, fields[4]}
	}

	return FlagResult{true, "RunAsInvoker"}
}

func (a *App) GetInterfaces() FlagResult {
	log.Printf("GetInterfaces")

	interfaces, err := net.Interfaces()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	var interfaceNames []string

	for _, inter := range interfaces {
		interfaceNames = append(interfaceNames, inter.Name)
	}

	return FlagResult{true, strings.Join(interfaceNames, "|")}
}
