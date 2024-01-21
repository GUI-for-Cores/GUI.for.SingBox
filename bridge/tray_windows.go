//go:build windows

package bridge

import (
	"os/exec"
	"strings"
	"syscall"
	"time"

	"github.com/energye/systray"
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
	systray.Quit()
	runtime.Quit(app.Ctx)
}

func TrayRestartApp(app *App) error {
	exePath := Env.BasePath + "\\" + Env.AppName

	cmd := exec.Command(exePath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

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
	menu := map[string]([2]string){
		"Show":    {"Show", "Show Window"},
		"Hide":    {"Hide", "Hide Window"},
		"Restart": {"Restart", "Restart Application"},
		"Quit":    {"Quit", "Quit Application"},
	}

	if Config.Lang == "zh" {
		menu = map[string]([2]string){
			"Show":    {"显示", "显示窗口"},
			"Hide":    {"隐藏", "隐藏窗口"},
			"Restart": {"重启", "重启程序"},
			"Quit":    {"退出", "退出程序"},
		}
	}

	go func() {
		systray.Run(func() {
			systray.SetIcon(icon)
			systray.SetTitle("GUI.for.SingBox")
			systray.SetTooltip("GUI.for.SingBox")

			mShow := systray.AddMenuItem(menu["Show"][0], menu["Show"][1])
			mHide := systray.AddMenuItem(menu["Hide"][0], menu["Hide"][1])

			systray.AddSeparator()

			mRestart := systray.AddMenuItem(menu["Restart"][0], menu["Restart"][1])
			mQuit := systray.AddMenuItem(menu["Quit"][0], menu["Quit"][1])

			mShow.Click(func() { runtime.WindowShow(a.Ctx) })

			mHide.Click(func() { runtime.WindowHide(a.Ctx) })

			mRestart.Click(func() { 
				runtime.EventsEmit(a.Ctx, "onShutdown", "")
				time.Sleep(500 * time.Millisecond) // 0.5s

				TrayRestartApp(a)
			})

			mQuit.Click(func() {
				runtime.EventsEmit(a.Ctx, "onShutdown", "")
				time.Sleep(500 * time.Millisecond) // 0.5s

				InitBridge()
				QuitApp(a, Config.CloseKernelOnExit)
			})

			systray.SetOnDClick(func(menu systray.IMenu) { runtime.WindowShow(a.Ctx) })

			systray.SetOnRClick(func(menu systray.IMenu) { menu.ShowMenu() })
		}, nil)
	}()
}
