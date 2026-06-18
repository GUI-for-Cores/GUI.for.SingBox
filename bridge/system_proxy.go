package bridge

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"regexp"
	"slices"
	"strings"
	"sync"
)

func (a *App) GetSystemProxy() FlagResult {
	log.Printf("GetSystemProxy")

	proxy := ""
	var err error

	switch Env.OS {
	case "windows":
		proxy, err = getWindowsSystemProxy()
	case "darwin":
		proxy, err = getDarwinSystemProxy()
	case "linux":
		proxy, err = getLinuxSystemProxy()
	}

	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, proxy}
}

func (a *App) SetSystemProxy(enable bool, server string, proxyType string, bypass string, darwinServices []string) FlagResult {
	log.Printf("SetSystemProxy: %t %s %s %s %v", enable, server, proxyType, bypass, darwinServices)

	if proxyType == "" {
		proxyType = "mixed"
	}

	var err error

	switch Env.OS {
	case "windows":
		err = setWindowsSystemProxy(server, enable, proxyType, bypass)
	case "darwin":
		err = setDarwinSystemProxy(server, enable, proxyType, bypass, darwinServices)
	case "linux":
		err = setLinuxSystemProxy(server, enable, proxyType, bypass)
	}

	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) GetSystemProxyBypass() FlagResult {
	log.Printf("GetSystemProxyBypass")

	bypass := ""
	var err error

	switch Env.OS {
	case "windows":
		bypass, err = getWindowsSystemProxyBypass()
	case "darwin":
		bypass, err = getDarwinSystemProxyBypass()
	case "linux":
		bypass, err = getLinuxSystemProxyBypass()
	}

	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, bypass}
}

func getWindowsSystemProxy() (string, error) {
	out, err := runSystemProxyCommand("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyEnable", "/t", "REG_DWORD")
	if err != nil {
		return "", err
	}
	if regexp.MustCompile(`REG_DWORD\s+0x0`).MatchString(out) {
		return "", nil
	}

	out, err = runSystemProxyCommand("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyServer", "/t", "REG_SZ")
	if err != nil {
		return "", err
	}

	match := regexp.MustCompile(`ProxyServer\s+REG_SZ\s+(\S+)`).FindStringSubmatch(out)
	if len(match) < 2 {
		return "", nil
	}
	if strings.HasPrefix(match[1], "socks") {
		return match[1], nil
	}
	return "http://" + match[1], nil
}

func getDarwinSystemProxy() (string, error) {
	out, err := runSystemProxyCommand("scutil", "--proxy")
	if err != nil {
		return "", err
	}

	values := map[string]string{}
	re := regexp.MustCompile(`(?m)^\s*(HTTPEnable|HTTPPort|HTTPProxy|SOCKSEnable|SOCKSPort|SOCKSProxy)\s*:\s*([^}\n]+)`)
	for _, match := range re.FindAllStringSubmatch(out, -1) {
		values[match[1]] = strings.TrimSpace(match[2])
	}

	if values["HTTPEnable"] == "1" {
		return "http://" + values["HTTPProxy"] + ":" + values["HTTPPort"], nil
	}
	if values["SOCKSEnable"] == "1" {
		return "socks5://" + values["SOCKSProxy"] + ":" + values["SOCKSPort"], nil
	}
	return "", nil
}

func getLinuxSystemProxy() (string, error) {
	backend, desktop := detectProxyBackend()

	switch backend {
	case "kde":
		kreadconfig := kdeReadCommand()
		if kreadconfig == "" {
			return "", fmt.Errorf("KDE detected but kreadconfig unavailable")
		}

		out, err := runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "ProxyType")
		if err != nil {
			return "", err
		}
		if !strings.Contains(out, "1") {
			return "", nil
		}

		if out, err = runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpProxy"); err == nil {
			if proxy := cleanProxyValue(out); proxy != "" {
				return strings.ReplaceAll(proxy, " ", ":"), nil
			}
		} else {
			return "", err
		}

		if out, err = runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "socksProxy"); err == nil {
			if proxy := cleanProxyValue(out); proxy != "" {
				return strings.ReplaceAll(proxy, " ", ":"), nil
			}
		} else {
			return "", err
		}

	case "gnome":
		hasSchema, err := hasGSettingsProxySchema()
		if err != nil {
			return "", err
		}
		if !hasSchema {
			return "", fmt.Errorf("GNOME-like desktop detected but org.gnome.system.proxy schema unavailable")
		}

		out, err := runSystemProxyCommand("gsettings", "get", "org.gnome.system.proxy", "mode")
		if err != nil {
			return "", err
		}
		if strings.Contains(out, "none") {
			return "", nil
		}
		if !strings.Contains(out, "manual") {
			return "", nil
		}

		httpHost, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.http", "host")
		if err != nil {
			return "", err
		}
		httpPort, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.http", "port")
		if err != nil {
			return "", err
		}
		if httpHost != "" && httpPort != "0" {
			return "http://" + httpHost + ":" + httpPort, nil
		}

		httpsHost, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.https", "host")
		if err != nil {
			return "", err
		}
		httpsPort, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.https", "port")
		if err != nil {
			return "", err
		}
		if httpsHost != "" && httpsPort != "0" {
			return "https://" + httpsHost + ":" + httpsPort, nil
		}

		socksHost, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.socks", "host")
		if err != nil {
			return "", err
		}
		socksPort, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.socks", "port")
		if err != nil {
			return "", err
		}
		if socksHost != "" && socksPort != "0" {
			return "socks5://" + socksHost + ":" + socksPort, nil
		}

	case "unknown":
		return "", fmt.Errorf("unsupported Linux proxy backend: %s", desktop)
	}

	return "", nil
}

func setWindowsSystemProxy(server string, enabled bool, proxyType string, bypass string) error {
	enabledValue := "0"
	proxyServer := ""
	if enabled {
		enabledValue = "1"
		proxyServer = server
		if proxyType == "socks" {
			proxyServer = "socks=" + server
		}
	}

	return runSystemProxyCommands(
		[]string{"reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", enabledValue, "/f"},
		[]string{"reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyServer", "/d", proxyServer, "/f"},
		[]string{"reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyOverride", "/d", normalizeBypass(bypass, ";"), "/f"},
	)
}

func setDarwinSystemProxy(server string, enabled bool, proxyType string, bypass string, services []string) error {
	commands := [][]string{}
	for _, device := range services {
		device = strings.TrimSpace(device)
		if device == "" {
			continue
		}
		state := "off"
		if enabled {
			state = "on"
		}

		httpState := "off"
		if proxyType == "mixed" || proxyType == "http" {
			httpState = state
		}

		socksState := "off"
		if proxyType == "mixed" || proxyType == "socks" {
			socksState = state
		}

		commands = append(commands,
			[]string{"networksetup", "-setwebproxystate", device, httpState},
			[]string{"networksetup", "-setsecurewebproxystate", device, httpState},
			[]string{"networksetup", "-setsocksfirewallproxystate", device, socksState},
			append([]string{"networksetup", "-setproxybypassdomains", device}, splitBypass(bypass)...),
		)

		serverName, serverPort := splitServer(server)
		if httpState == "on" {
			commands = append(commands,
				[]string{"networksetup", "-setwebproxy", device, serverName, serverPort},
				[]string{"networksetup", "-setsecurewebproxy", device, serverName, serverPort},
			)
		}
		if socksState == "on" {
			commands = append(commands, []string{"networksetup", "-setsocksfirewallproxy", device, serverName, serverPort})
		}
	}
	return runSystemProxyCommands(commands...)
}

func setLinuxSystemProxy(server string, enabled bool, proxyType string, bypass string) error {
	serverName, serverPort := splitServer(server)
	httpEnabled := enabled && (proxyType == "mixed" || proxyType == "http")
	socksEnabled := enabled && (proxyType == "mixed" || proxyType == "socks")
	backend, desktop := detectProxyBackend()

	switch backend {
	case "kde":
		kwriteconfig := kdeWriteCommand()
		if kwriteconfig == "" {
			return fmt.Errorf("KDE detected but kwriteconfig unavailable")
		}

		proxyTypeValue := "0"
		if enabled {
			proxyTypeValue = "1"
		}

		return runSystemProxyCommands(
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "ProxyType", proxyTypeValue},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpProxy", enabledURL(httpEnabled, "http://"+server)},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpsProxy", enabledURL(httpEnabled, "http://"+server)},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "socksProxy", enabledURL(socksEnabled, "socks://"+server)},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "NoProxyFor", normalizeBypass(bypass, ",")},
		)

	case "gnome":
		hasSchema, err := hasGSettingsProxySchema()
		if err != nil {
			return err
		}
		if !hasSchema {
			return fmt.Errorf("GNOME-like desktop detected but org.gnome.system.proxy schema unavailable")
		}

		mode := "none"
		if enabled {
			mode = "manual"
		}
		bypassItems := splitBypass(bypass)
		quotedBypassItems := make([]string, 0, len(bypassItems))
		for _, item := range bypassItems {
			quotedBypassItems = append(quotedBypassItems, "'"+strings.ReplaceAll(item, "'", "\\'")+"'")
		}
		ignoreHosts := "[" + strings.Join(quotedBypassItems, ",") + "]"

		return runSystemProxyCommands(
			[]string{"gsettings", "set", "org.gnome.system.proxy", "mode", mode},
			[]string{"gsettings", "set", "org.gnome.system.proxy.http", "host", enabledURL(httpEnabled, serverName)},
			[]string{"gsettings", "set", "org.gnome.system.proxy.http", "port", enabledURL(httpEnabled, serverPort, "0")},
			[]string{"gsettings", "set", "org.gnome.system.proxy.https", "host", enabledURL(httpEnabled, serverName)},
			[]string{"gsettings", "set", "org.gnome.system.proxy.https", "port", enabledURL(httpEnabled, serverPort, "0")},
			[]string{"gsettings", "set", "org.gnome.system.proxy.socks", "host", enabledURL(socksEnabled, serverName)},
			[]string{"gsettings", "set", "org.gnome.system.proxy.socks", "port", enabledURL(socksEnabled, serverPort, "0")},
			[]string{"gsettings", "set", "org.gnome.system.proxy", "ignore-hosts", ignoreHosts},
		)

	default:
		return fmt.Errorf("unsupported Linux proxy backend: %s", desktop)
	}
}

func getWindowsSystemProxyBypass() (string, error) {
	out, err := runSystemProxyCommand("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyOverride")
	if err != nil {
		return "", err
	}
	match := regexp.MustCompile(`ProxyOverride\s+REG_SZ\s+(\S+)`).FindStringSubmatch(out)
	if len(match) < 2 {
		return "", nil
	}
	return match[1], nil
}

func getDarwinSystemProxyBypass() (string, error) {
	result := []string{}
	for _, device := range []string{"Ethernet", "Wi-Fi"} {
		out, err := runSystemProxyCommand("networksetup", "-getproxybypassdomains", device)
		if err != nil {
			return "", err
		}
		if strings.TrimSpace(out) == "" {
			continue
		}
		for item := range strings.SplitSeq(strings.TrimSpace(out), "\n") {
			item = strings.TrimSpace(item)
			if item != "" {
				result = append(result, item)
			}
		}
	}
	return strings.Join(result, ";"), nil
}

func getLinuxSystemProxyBypass() (string, error) {
	backend, desktop := detectProxyBackend()

	switch backend {
	case "kde":
		kreadconfig := kdeReadCommand()
		if kreadconfig == "" {
			return "", fmt.Errorf("KDE detected but kreadconfig unavailable")
		}

		out, err := runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "NoProxyFor")
		if err != nil {
			return "", err
		}
		return normalizeBypass(strings.ReplaceAll(strings.TrimSpace(out), ",", ";"), ";"), nil

	case "gnome":
		hasSchema, err := hasGSettingsProxySchema()
		if err != nil {
			return "", err
		}
		if !hasSchema {
			return "", fmt.Errorf("GNOME-like desktop detected but org.gnome.system.proxy schema unavailable")
		}

		out, err := runSystemProxyCommand("gsettings", "get", "org.gnome.system.proxy", "ignore-hosts")
		if err != nil {
			return "", err
		}
		arrStart := strings.Index(out, "[")
		if arrStart >= 0 {
			out = out[arrStart:]
		}
		out = strings.ReplaceAll(out, "'", `"`)

		var items []string
		if err := json.Unmarshal([]byte(out), &items); err != nil {
			return "", err
		}
		return strings.Join(items, ";"), nil

	case "unknown":
		return "", fmt.Errorf("unsupported Linux proxy backend: %s", desktop)
	}

	return "", nil
}

func runSystemProxyCommand(path string, args ...string) (string, error) {
	cmd := exec.Command(path, args...)
	SetCmdWindowHidden(cmd)
	cmd.Env = os.Environ()

	out, err := cmd.CombinedOutput()
	output := strings.TrimSpace(string(out))
	if err != nil {
		log.Printf("SystemProxy command failed: %s %v: %v %s", path, args, err, output)
		if output != "" {
			return output, fmt.Errorf("%s %v: %s", path, args, output)
		}
		return output, fmt.Errorf("%s %v: %w", path, args, err)
	}
	return output, nil
}

func runSystemProxyCommands(commands ...[]string) error {
	var wg sync.WaitGroup
	var mu sync.Mutex
	messages := []string{}
	for _, command := range commands {
		wg.Go(func() {
			if _, err := runSystemProxyCommand(command[0], command[1:]...); err != nil {
				mu.Lock()
				messages = append(messages, err.Error())
				mu.Unlock()
			}
		})
	}
	wg.Wait()
	if len(messages) > 0 {
		return errors.New(strings.Join(messages, "; "))
	}
	return nil
}

func splitServer(server string) (string, string) {
	serverName, serverPort, ok := strings.Cut(server, ":")
	if !ok {
		return server, ""
	}
	return serverName, serverPort
}

func splitBypass(bypass string) []string {
	result := []string{}
	for item := range strings.SplitSeq(bypass, ";") {
		item = strings.TrimSpace(item)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}

func normalizeBypass(bypass string, separator string) string {
	return strings.Join(splitBypass(bypass), separator)
}

func enabledURL(enabled bool, value string, fallback ...string) string {
	if enabled {
		return value
	}
	if len(fallback) > 0 {
		return fallback[0]
	}
	return ""
}

func cleanProxyValue(value string) string {
	return strings.ReplaceAll(strings.Trim(value, "'\"\n\r "), "\n", "")
}

func systemProxyCommandValue(path string, args ...string) (string, error) {
	out, err := runSystemProxyCommand(path, args...)
	if err != nil {
		return "", err
	}
	return cleanProxyValue(out), nil
}

func detectProxyBackend() (string, string) {
	desktop := strings.TrimSpace(os.Getenv("XDG_CURRENT_DESKTOP"))
	normalizedDesktop := strings.ToLower(desktop)

	tokens := strings.FieldsFunc(normalizedDesktop, func(r rune) bool {
		return r == ':' || r == ';' || r == ','
	})

	has := func(names ...string) bool {
		for _, token := range tokens {
			token = strings.TrimSpace(token)
			if slices.Contains(names, token) {
				return true
			}
		}
		return false
	}

	if has("kde", "plasma") {
		return "kde", desktop
	}

	if hasGSettingsProxyModeWritable() {
		return "gnome", desktop
	}

	return "unknown", desktop
}

func kdeWriteCommand() string {
	if _, err := exec.LookPath("kwriteconfig6"); err == nil {
		return "kwriteconfig6"
	}
	if _, err := exec.LookPath("kwriteconfig5"); err == nil {
		return "kwriteconfig5"
	}
	return ""
}

func kdeReadCommand() string {
	if _, err := exec.LookPath("kreadconfig6"); err == nil {
		return "kreadconfig6"
	}
	if _, err := exec.LookPath("kreadconfig5"); err == nil {
		return "kreadconfig5"
	}
	return ""
}

func hasGSettingsProxySchema() (bool, error) {
	out, err := runSystemProxyCommand("gsettings", "list-schemas")
	if err != nil {
		return false, err
	}
	return strings.Contains(out, "org.gnome.system.proxy"), nil
}

func hasGSettingsProxyModeWritable() bool {
	out, err := runSystemProxyCommand("gsettings", "writable", "org.gnome.system.proxy", "mode")
	return err == nil && strings.TrimSpace(out) == "true"
}
