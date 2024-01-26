package bridge

import (
	"context"
	"os"
	"path/filepath"
	"runtime"

	"github.com/wailsapp/wails/v2/pkg/options"
	R "github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.Ctx = ctx
}

func (a *App) OnSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	R.WindowUnminimise(*&a.Ctx)
	R.Show(*&a.Ctx)
	go R.EventsEmit(*&a.Ctx, "launchArgs", secondInstanceData.Args)
}

var Env = &EnvResult{
	BasePath:    "",
	AppName:     "",
	OS:          runtime.GOOS,
	ARCH:        runtime.GOARCH,
	FromTaskSch: false,
}

var Config = &AppConfig{}

func InitBridge() {
	// step1: Set Env
	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	for _, v := range os.Args {
		if v == "tasksch" {
			Env.FromTaskSch = true
			break
		}
	}

	Env.BasePath = filepath.Dir(exePath)
	Env.AppName = filepath.Base(exePath)

	// step2: Read Config
	b, err := os.ReadFile(Env.BasePath + "/data/user.yaml")
	if err == nil {
		yaml.Unmarshal(b, &Config)
	}
}
