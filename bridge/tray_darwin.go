//go:build darwin

package bridge

import (
	"embed"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func InitTray(a *App, icon []byte, fs embed.FS) {}

func (a *App) UpdateTray(tray TrayContent) {}

func (a *App) ExitApp() {
	runtime.Quit(a.Ctx)
	os.Exit(0)
}
