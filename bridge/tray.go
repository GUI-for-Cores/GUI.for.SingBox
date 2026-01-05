package bridge

import (
	"log"
	"os"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CreateTray(a *App, icon []byte) (trayStart, trayEnd func()) {
	return systray.RunWithExternalLoop(func() {
		systray.SetIcon(icon)
		systray.SetTooltip("GUI.for.Cores")

		systray.SetOnRClick(func(menu systray.IMenu) { menu.ShowMenu() })
		systray.SetOnClick(func(menu systray.IMenu) {
			if Env.OS == "darwin" {
				menu.ShowMenu()
			} else {
				a.ShowMainWindow()
			}
		})

		// Ensure the tray is still available if rolling-release fails
		addClickMenuItem("Show", "Show", func() { a.ShowMainWindow() })
		addClickMenuItem("Restart", "Restart", func() { a.RestartApp() })
		addClickMenuItem("Exit", "Exit", func() { a.ExitApp() })
	}, nil)
}

func (a *App) UpdateTray(tray TrayContent) {
	log.Printf("UpdateTray")
	updateTray(a, tray)
}

func (a *App) UpdateTrayMenus(menus []MenuItem) {
	log.Printf("UpdateTrayMenus")
	updateTrayMenus(a, menus)
}

func (a *App) UpdateTrayAndMenus(tray TrayContent, menus []MenuItem) {
	log.Printf("UpdateTrayAndMenus")
	updateTray(a, tray)
	updateTrayMenus(a, menus)
}

func (a *App) ExitApp() {
	systray.Quit()
	runtime.Quit(a.Ctx)
	os.Exit(0)
}

func addClickMenuItem(title, tooltip string, action func()) *systray.MenuItem {
	m := systray.AddMenuItem(title, tooltip)
	m.Click(action)
	return m
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

func updateTray(a *App, tray TrayContent) {
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

func updateTrayMenus(a *App, menus []MenuItem) {
	systray.ResetMenu()

	for _, menu := range menus {
		createMenuItem(menu, a, nil)
	}
}
