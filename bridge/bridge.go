package bridge

import (
	"embed"
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

func InitBridge(fs embed.FS) {
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

	// step3: Extract embedded files
	icon_src := "frontend/dist/icons"
	icon_dst := "data/.cache/icons"
	img_src := "frontend/dist/imgs"
	img_dst := "data/.cache/imgs"

	os.MkdirAll(GetPath(icon_dst), os.ModePerm)
	os.MkdirAll(GetPath(img_dst), os.ModePerm)

	icon_dirs, _ := fs.ReadDir(icon_src)
	png_dirs, _ := fs.ReadDir(img_src)

	for _, file := range icon_dirs {
		fileName := file.Name()
		path := GetPath(icon_dst + "/" + fileName)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			log.Printf("InitResources [Icon]: %s", icon_dst+"/"+fileName)
			b, _ := fs.ReadFile(icon_src + "/" + fileName)
			os.WriteFile(path, b, os.ModePerm)
		}
	}

	for _, file := range png_dirs {
		fileName := file.Name()
		path := GetPath(img_dst + "/" + fileName)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			log.Printf("InitResources [Imgs]: %s", img_dst+"/"+fileName)
			b, _ := fs.ReadFile(img_src + "/" + fileName)
			os.WriteFile(path, b, os.ModePerm)
		}
	}

	// step4: Read Config
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
