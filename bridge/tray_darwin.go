//go:build darwin

package bridge

import (
	"os/exec"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CloseKernel(app *App) {
	info := app.ProcessInfo(Config.Kernel.Pid)
	if info.Flag && strings.HasPrefix(info.Data, "sing-box") {
		app.KillProcess(int(Config.Kernel.Pid))
	}
	app.SetSystemProxy(false, "")
}

func QuitApp(app *App, closeKernel bool) {
	if closeKernel {
		CloseKernel(app)
	}
	runtime.Quit(app.Ctx)
}

func TrayRestartApp(app *App) error {
	exePath := Env.BasePath + "\\" + Env.AppName

	cmd := exec.Command(exePath)

	err := cmd.Start()
	if err != nil {
		return err
	}

	QuitApp(app, false)
	return nil
}

func (a *App) RestartApp() FlagResult {
	err := TrayRestartApp(a)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, "Success"}
}

func CreateTray(a *App, icon []byte) {
}
