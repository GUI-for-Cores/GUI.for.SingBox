package main

import (
	"context"
	"embed"
	"guiforcores/bridge"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed frontend/dist/favicon.ico
var icon []byte

var isStartup = true

func main() {
	bridge.InitBridge()

	// Create an instance of the app structure
	app := bridge.NewApp()

	AppMenu := menu.NewMenu()

	if bridge.Env.OS == "darwin" {
		appMenu := AppMenu.AddSubmenu("App")
		appMenu.AddText("Show", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
			runtime.WindowShow(app.Ctx)
		})
		appMenu.AddText("Hide", keys.CmdOrCtrl("h"), func(_ *menu.CallbackData) {
			runtime.WindowHide(app.Ctx)
		})
		appMenu.AddSeparator()
		appMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
			runtime.EventsEmit(app.Ctx, "quitApp")
		})

		// on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
		AppMenu.Append(menu.EditMenu())
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title: bridge.Env.AppName,
		Menu:  AppMenu,
		Width: func() int {
			if bridge.Config.Width != 0 {
				return bridge.Config.Width
			}
			return 800
		}(),
		Height: func() int {
			if bridge.Config.Height != 0 {
				return bridge.Config.Height
			}
			if bridge.Env.OS == "linux" {
				return 510
			}
			return 540
		}(),
		MinWidth:      600,
		MinHeight:     400,
		Frameless:     bridge.Env.OS == "windows",
		DisableResize: false,
		StartHidden: func() bool {
			if bridge.Env.FromTaskSch {
				return bridge.Config.WindowStartState == 2
			}
			return false
		}(),
		WindowStartState: func() options.WindowStartState {
			if bridge.Env.FromTaskSch {
				return options.WindowStartState(bridge.Config.WindowStartState)
			}
			return 0
		}(),
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			BackdropType:         windows.Acrylic,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			Appearance:           mac.DefaultAppearance,
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			About: &mac.AboutInfo{
				Title:   bridge.Env.AppName,
				Message: "© 2024 GUI.for.Cores",
				Icon:    icon,
			},
		},
		Linux: &linux.Options{
			Icon:                icon,
			WindowIsTranslucent: false,
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: func() string {
				if bridge.Config.MultipleInstance {
					return uuid.New().String()
				}
				return bridge.Env.AppName
			}(),
			OnSecondInstanceLaunch: func(data options.SecondInstanceData) {
				runtime.Show(app.Ctx)
				runtime.EventsEmit(app.Ctx, "launchArgs", data.Args)
			},
		},
		OnStartup: func(ctx context.Context) {
			runtime.LogSetLogLevel(ctx, logger.INFO)
			app.Ctx = ctx
			bridge.InitTray(app, icon, assets)
			bridge.InitScheduledTasks()
			bridge.InitNotification(assets)
		},
		OnDomReady: func(ctx context.Context) {
			if isStartup {
				runtime.EventsEmit(ctx, "onStartup")
				isStartup = false
			}
		},
		OnBeforeClose: func(ctx context.Context) (prevent bool) {
			runtime.EventsEmit(ctx, "beforeClose")
			return true
		},
		Bind: []interface{}{
			app,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
