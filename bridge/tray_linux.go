//go:build linux

package bridge

import (
	"embed"
	"os"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CreateTray(a *App, icon []byte, fs embed.FS) {
}

func (a *App) UpdateTray(tray TrayContent) {
}

func (a *App) UpdateTrayMenus(menus []MenuItem) {
}

func (a *App) ExitApp() {
	runtime.Quit(a.Ctx)
	os.Exit(0)
}

func (a *App) RestartApp() FlagResult {
	exePath := Env.BasePath + "/" + Env.AppName

	cmd := exec.Command(exePath)

	err := cmd.Start()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	a.ExitApp()

	return FlagResult{true, "Success"}
}
