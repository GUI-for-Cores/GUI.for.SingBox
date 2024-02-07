//go:build windows

package bridge

import (
	"embed"
	"fmt"
	"os/exec"
	"syscall"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var assets embed.FS

func CreateTray(a *App, icon []byte, fs embed.FS) {
	assets = fs
	go func() {
		systray.Run(func() {
			systray.SetIcon([]byte(icon))
			systray.SetTitle("GUI.for.SingBox")
			systray.SetTooltip("GUI.for.SingBox")
			systray.SetOnDClick(func(menu systray.IMenu) { runtime.WindowShow(a.Ctx) })
			systray.SetOnRClick(func(menu systray.IMenu) { menu.ShowMenu() })
		}, nil)
	}()
}

func (a *App) UpdateTray(icon TrayContents) {
	fmt.Println("UpdateTray")

	if icon.Icon != "" {
		ico, _ := assets.ReadFile("frontend/dist/" + icon.Icon)
		systray.SetIcon(ico)
	}
	if icon.Title != "" {
		systray.SetTitle(icon.Title)
	}
	if icon.Tooltip != "" {
		systray.SetTooltip(icon.Tooltip)
	}
}

func (a *App) UpdateTrayMenus(menus []MenuItem) {
	fmt.Println("UpdateTrayMenus")

	systray.ResetMenu()

	for _, menu := range menus {
		createMenuItem(menu, a, nil)
	}
}

func createMenuItem(menu MenuItem, a *App, parent *systray.MenuItem) {
	if !menu.Show {
		return
	}
	switch menu.Type {
	case "item":
		var m *systray.MenuItem
		if parent == nil {
			m = systray.AddMenuItem(menu.Text, menu.Tooltip)
		} else {
			m = parent.AddSubMenuItem(menu.Text, menu.Tooltip)
		}
		m.Click(func() { runtime.EventsEmit(a.Ctx, menu.Event) })

		if menu.Checked {
			m.Check()
		}

		for _, child := range menu.Children {
			createMenuItem(child, a, m)
		}
	case "separator":
		systray.AddSeparator()
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