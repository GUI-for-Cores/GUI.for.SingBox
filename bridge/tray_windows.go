//go:build windows

package bridge

import (
	"embed"
	"log"
	"os"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func InitTray(a *App, icon []byte, fs embed.FS) {
	icons := [6][2]string{
		{"frontend/dist/icons/tray_normal_light.ico", "data/.cache/icons/tray_normal_light.ico"},
		{"frontend/dist/icons/tray_normal_dark.ico", "data/.cache/icons/tray_normal_dark.ico"},
		{"frontend/dist/icons/tray_proxy_light.ico", "data/.cache/icons/tray_proxy_light.ico"},
		{"frontend/dist/icons/tray_proxy_dark.ico", "data/.cache/icons/tray_proxy_dark.ico"},
		{"frontend/dist/icons/tray_tun_light.ico", "data/.cache/icons/tray_tun_light.ico"},
		{"frontend/dist/icons/tray_tun_dark.ico", "data/.cache/icons/tray_tun_dark.ico"},
	}

	os.MkdirAll(GetPath("data/.cache/icons"), os.ModePerm)

	for _, item := range icons {
		path := GetPath(item[1])
		if _, err := os.Stat(path); os.IsNotExist(err) {
			log.Printf("InitTray [Icon]: %s", item[1])
			b, _ := fs.ReadFile(item[0])
			os.WriteFile(path, b, os.ModePerm)
		}
	}

	go systray.Run(func() {
		systray.SetIcon([]byte(icon))
		systray.SetTitle("GUI.for.Cores")
		systray.SetTooltip("GUI.for.Cores")
		systray.SetOnClick(func(menu systray.IMenu) { runtime.WindowShow(a.Ctx) })
		systray.SetOnRClick(func(menu systray.IMenu) { menu.ShowMenu() })

		mRestart := systray.AddMenuItem("Restart", "Restart App")
		mExit := systray.AddMenuItem("Exit", "Exit App")

		mRestart.Click(func() {
			a.RestartApp()
		})

		mExit.Click(func() {
			runtime.EventsEmit(a.Ctx, "quitApp")
		})
	}, nil)
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
