package bridge

import (
	"log"
	"os"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

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
