package bridge

import (
	"log"
	"net"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"

	sysruntime "runtime"

	"github.com/klauspost/cpuid/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

var isStartup = true

var Env = &EnvResult{
	BasePath:    "",
	AppName:     "",
	OS:          sysruntime.GOOS,
	ARCH:        sysruntime.GOARCH,
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

	// step2: Create a persistent data symlink
	if Env.OS == "darwin" {
		user, _ := user.Current()
		linkPath := Env.BasePath + "/data"
		appPath := "/Users/" + user.Username + "/Library/Application Support/" + Env.AppName
		os.MkdirAll(appPath, os.ModePerm)
		os.Symlink(appPath, linkPath)
	}

	// step3: Read Config
	b, err := os.ReadFile(Env.BasePath + "/data/user.yaml")
	if err == nil {
		yaml.Unmarshal(b, &Config)
	}

	if Config.Width == 0 {
		Config.Width = 800
	}

	if Config.Height == 0 {
		if Env.OS == "linux" {
			Config.Height = 510
		} else {
			Config.Height = 540
		}
	}

	Config.StartHidden = Env.FromTaskSch && Config.WindowStartState == int(options.Minimised)

	if !Env.FromTaskSch {
		Config.WindowStartState = int(options.Normal)
	}
}

func (a *App) IsStartup() bool {
	if isStartup {
		isStartup = false
		return true
	}
	return false
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

func (a *App) GetEnv() EnvResult {
	return EnvResult{
		AppName:  Env.AppName,
		BasePath: Env.BasePath,
		OS:       Env.OS,
		ARCH:     Env.ARCH,
		X64Level: Env.X64Level,
	}
}

func (a *App) GetInterfaces() FlagResult {
	log.Printf("GetInterfaces")

	interfaces, err := net.Interfaces()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	var interfaceNames []string

	for _, inter := range interfaces {
		interfaceNames = append(interfaceNames, inter.Name)
	}

	return FlagResult{true, strings.Join(interfaceNames, "|")}
}

func (a *App) ShowMainWindow() {
	runtime.WindowShow(a.Ctx)
}
