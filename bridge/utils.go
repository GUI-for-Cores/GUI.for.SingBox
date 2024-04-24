package bridge

import (
	"log"
	"net"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"

	"golang.org/x/text/encoding/simplifiedchinese"
)

func GetPath(path string) string {
	if filepath.IsAbs(path) {
		return path
	}
	path = filepath.Join(Env.BasePath, path)
	path = filepath.Clean(path)
	return path
}

func GetProxy(_proxy string) func(*http.Request) (*url.URL, error) {
	proxy := http.ProxyFromEnvironment

	if _proxy != "" {
		if !strings.HasPrefix(_proxy, "http") {
			_proxy = "http://" + _proxy
		}
		proxyUrl, err := url.Parse(_proxy)
		if err == nil {
			proxy = http.ProxyURL(proxyUrl)
		}
	}

	return proxy
}

func ConvertByte2String(byte []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(byte)
	return string(decodeBytes)
}

func (a *App) AbsolutePath(path string) FlagResult {
	log.Printf("AbsolutePath: %s", path)

	path = GetPath(path)

	return FlagResult{true, path}
}

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
