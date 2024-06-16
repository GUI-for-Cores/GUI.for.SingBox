package bridge

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/klauspost/cpuid/v2"
	"gopkg.in/yaml.v3"
)

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

var Env = &EnvResult{
	BasePath:    "",
	AppName:     "",
	OS:          runtime.GOOS,
	ARCH:        runtime.GOARCH,
	X64Level:    cpuid.CPU.X64Level(),
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

func (a *App) RestartApp() FlagResult {
	exePath := Env.BasePath + "/" + Env.AppName

	cmd := exec.Command(exePath)
	HideExecWindow(cmd)

	err := cmd.Start()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	a.ExitApp()

	return FlagResult{true, "Success"}
}
