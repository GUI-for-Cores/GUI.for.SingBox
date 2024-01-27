//go:build windows

package bridge

import (
	"os/exec"
	"syscall"
	"time"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CreateTray(a *App, icon []byte) {
	go func() {
		systray.Run(func() {
			systray.SetIcon([]byte(icon))
			systray.SetTitle("GUI.for.SingBox")
			systray.SetTooltip("GUI.for.SingBox")

			time.Sleep(3 * time.Second)

			runtime.EventsEmit(a.Ctx, "onTrayReady")
		}, nil)
	}()
}

func (a *App) UpdateTray(icon TrayContents) {
	if icon.Icon != "" {
		icon := a.Readfile(icon.Icon).Data
		systray.SetIcon([]byte(icon))
	}
	if icon.Title != "" {
		systray.SetTitle(icon.Title)
	}
	if icon.Tooltip != "" {
		systray.SetTooltip(icon.Tooltip)
	}
}

func (a *App) UpdateTrayMenus(menus []MenuItem) {
	systray.ResetMenu()

	for _, menu := range menus {
		currentMenu := menu

		switch menu.Type {
		case "item":
			m := systray.AddMenuItem(menu.Text, menu.Tooltip)
			m.Click(func() { runtime.EventsEmit(a.Ctx, currentMenu.Event) })
		case "separator":
			systray.AddSeparator()
		}
	}
}

func (a *App) ExitApp() {
	systray.Quit()
	runtime.Quit(a.Ctx)
}

func (a *App) RestartApp() FlagResult {
	exePath := Env.BasePath + "\\" + Env.AppName

	cmd := exec.Command(exePath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	err := cmd.Start()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	a.ExitApp()

	return FlagResult{true, "Success"}
}