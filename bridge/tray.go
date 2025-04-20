package bridge

import (
	"log"
	"os"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func InitTray(a *App, icon []byte) (trayStart, trayEnd func()) {
	isDarwin := Env.OS == "darwin"

	return systray.RunWithExternalLoop(func() {
		systray.SetIcon(icon)
		systray.SetTooltip("GUI.for.Cores")
		systray.SetOnRClick(func(menu systray.IMenu) { menu.ShowMenu() })
		if isDarwin {
			systray.SetOnClick(func(menu systray.IMenu) { menu.ShowMenu() })
		} else {
			systray.SetTitle("GUI.for.Cores")
			systray.SetOnClick(func(menu systray.IMenu) { a.ShowMainWindow() })
		}

		// Ensure the tray is still available if rolling-release fails
		mShowWindow := systray.AddMenuItem("Show", "Show")
		mRestart := systray.AddMenuItem("Restart", "Restart")
		mExit := systray.AddMenuItem("Exit", "Exit")
		mShowWindow.Click(func() { a.ShowMainWindow() })
		mRestart.Click(func() { a.RestartApp() })
		mExit.Click(func() { a.ExitApp() })
	}, nil)
}

func (a *App) UpdateTrayMenus(menus []MenuItem) {
	log.Printf("UpdateTrayMenus")

	systray.ResetMenu()

	for _, menu := range menus {
		createMenuItem(menu, a, nil)
	}
}

func createMenuItem(menu MenuItem, a *App, parent *systray.MenuItem) {
	if menu.Hidden {
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

		m.Click(func() { go runtime.EventsEmit(a.Ctx, "onMenuItemClick", menu.Event) })

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

func (a *App) UpdateTray(tray TrayContent) {
	if tray.Icon != "" {
		ico, err := os.ReadFile(GetPath(tray.Icon))
		if err == nil {
			systray.SetIcon(ico)
		}
	}
	if tray.Title != "" {
		systray.SetTitle(tray.Title)
		runtime.WindowSetTitle(a.Ctx, tray.Title)
	}
	if tray.Tooltip != "" {
		systray.SetTooltip(tray.Tooltip)
	}
}

func (a *App) ExitApp() {
	systray.Quit()
	runtime.Quit(a.Ctx)
	os.Exit(0)
}
