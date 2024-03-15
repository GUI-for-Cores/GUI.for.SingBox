//go:build windows

package bridge

import (
	"log"
	"net"
	"strings"
)

func (a *App) GetEnv() EnvResult {
	return EnvResult{
		AppName:  Env.AppName,
		BasePath: Env.BasePath,
		OS:       Env.OS,
		ARCH:     Env.ARCH,
		X64Level: Env.X64Level,
	}
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
