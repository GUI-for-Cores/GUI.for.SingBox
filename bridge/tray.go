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

		addClickMenuItem := func(title, tooltip string, action func()) {
			m := systray.AddMenuItem(title, tooltip)
			m.Click(action)
		}

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

// =======================================================
// 核心托盘渲染逻辑：包含 Linux GNOME 防卡死与 Checkbox 修复
// =======================================================

func createMenuItem(menu MenuItem, a *App, parent *systray.MenuItem, depth int, isProxyGroup bool) {
	if menu.Hidden {
		return
	}

	// 【智能识别】：如果是一级菜单，且名字是代理组，开启拦截标志
	// 做了中英文兼容，防止切换语言后失效
	if depth == 0 && (menu.Text == "代理组" || menu.Text == "Proxies" || menu.Text == "Proxy Groups") {
		isProxyGroup = true
	}

	switch menu.Type {
	case "item":
		var m *systray.MenuItem

		if parent == nil {
			m = systray.AddMenuItem(menu.Text, menu.Tooltip)
		} else {
			if Env.OS == "linux" {
				// Linux 下强制使用 Checkbox API 渲染状态
				m = parent.AddSubMenuItemCheckbox(menu.Text, menu.Tooltip, menu.Checked)
			} else {
				m = parent.AddSubMenuItem(menu.Text, menu.Tooltip)
			}
		}

		m.Click(func() {
			// 【交互降级】：只有属于“代理组”的深层节点，点击时才唤起主界面，防止 GNOME 托盘卡死
			if Env.OS == "linux" && len(menu.Children) > 0 && isProxyGroup && depth >= 1 {
				a.ShowMainWindow()
				return
			}
			go runtime.EventsEmit(a.Ctx, "onMenuItemClick", menu.Event)
		})

		if menu.Checked {
			m.Check()
		}

		for _, child := range menu.Children {
			// 【核心修复】：只拦截“代理组”的深层节点，完美放行“通用”、“主题”等基础设置的展开！
			if Env.OS == "linux" && isProxyGroup && depth >= 1 {
				continue
			}
			createMenuItem(child, a, m, depth+1, isProxyGroup)
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
		// 初始调用时层级从 0 开始，默认不是代理组 (false)
		createMenuItem(menu, a, nil, 0, false)
	}
}
