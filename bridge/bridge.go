package bridge

import (
	"embed"
	"flag"
	"io"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strconv"
	"strings"

	sysruntime "runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

var Config = &AppConfig{}

var Env = &EnvResult{
	IsStartup:    true,
	PreventExit:  true,
	WebviewPath:  "",
	AppId:        "GUI.for.SingBox",
	AppName:      "",
	AppVersion:   "v1.29.0",
	BasePath:     "",
	DataDir:      "",
	OS:           sysruntime.GOOS,
	ARCH:         sysruntime.GOARCH,
	IsPrivileged: false,
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		AppMenu: menu.NewMenu(),
	}
}

func CreateApp(fs embed.FS) *App {
	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	Env.BasePath = filepath.ToSlash(filepath.Dir(exePath))
	Env.AppName = filepath.Base(exePath)

	dataDir, portable, restartFrom := parseArgs(os.Args[1:])
	waitForExit(restartFrom)
	initDataDir(dataDir, portable)

	if priv, err := IsPrivileged(); err == nil {
		Env.IsPrivileged = priv
	}

	app := NewApp()

	if Env.OS == "darwin" {
		createMacOSMenus(app)
	}

	if Env.OS == "windows" {
		processFixedWebView2Runtime()
	}

	extractEmbeddedFiles(fs)

	loadConfig()

	return app
}

func (a *App) IsStartup() bool {
	if Env.IsStartup {
		Env.IsStartup = false
		return true
	}
	return false
}

func (a *App) ExitApp() {
	log.Printf("ExitApp")
	Env.PreventExit = false
	runtime.Quit(a.Ctx)
}

func (a *App) RestartApp(admin bool) FlagResult {
	log.Printf("RestartApp: %v", admin)
	exePath := filepath.Join(Env.BasePath, Env.AppName)
	args := append(slices.Clone(Env.Args), "--restart-from="+strconv.Itoa(os.Getpid()))

	// The new instance waits for this one to exit and release the single-instance lock
	if err := startApp(exePath, args, admin); err != nil {
		return FlagResult{false, err.Error()}
	}

	a.ExitApp()

	return FlagResult{true, "Success"}
}

func (a *App) GetEnv(key string) any {
	log.Printf("GetEnv: %s", key)
	if key != "" {
		return os.Getenv(key)
	}
	return EnvResult{
		AppId:        Env.AppId,
		AppName:      Env.AppName,
		AppVersion:   Env.AppVersion,
		BasePath:     Env.BasePath,
		DataDir:      Env.DataDir,
		Args:         Env.Args,
		LaunchArgs:   Env.LaunchArgs,
		OS:           Env.OS,
		ARCH:         Env.ARCH,
		IsPrivileged: Env.IsPrivileged,
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
	log.Printf("ShowMainWindow")
	runtime.WindowShow(a.Ctx)
}

func initDataDir(dir string, portable bool) {
	// Portable data sits beside the app, which on macOS is the whole .app bundle
	root := Env.BasePath
	if bundle, ok := strings.CutSuffix(root, ".app/Contents/MacOS"); ok && Env.OS == "darwin" {
		root = filepath.Dir(bundle)
	}

	if dir == "" {
		dir = "data"
		if _, err := os.Stat(filepath.Join(root, dir)); err != nil && !portable {
			if userDir, err := defaultDataDir(); err == nil {
				dir = userDir
			}
		}
	}
	if !filepath.IsAbs(dir) {
		dir = filepath.Join(root, dir)
	}

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		log.Printf("Failed to create data directory: %v", err)
	}

	if realDir, err := filepath.EvalSymlinks(dir); err == nil {
		dir = realDir
	}

	Env.DataDir = filepath.ToSlash(filepath.Clean(dir))
}

func parseArgs(args []string) (dataDir string, portable bool, restartFrom int) {
	Env.LaunchArgs = slices.Clone(args)
	fs := flag.NewFlagSet(Env.AppName, flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	fs.StringVar(&dataDir, "data-dir", "", "data directory")
	fs.BoolVar(&portable, "portable", false, "keep data next to the app")
	fs.IntVar(&restartFrom, "restart-from", 0, "pid of the instance to wait for")
	Env.WindowStartState = options.Normal
	fs.Func("window-start-state", "normal or minimised", func(v string) error {
		switch strings.ToLower(v) {
		case "normal":
			Env.WindowStartState = options.Normal
		case "minimised":
			Env.WindowStartState = options.Minimised
		default:
			log.Printf("Ignoring unknown --window-start-state %q", v)
		}
		return nil
	})

	// Skip positional and unknown args, e.g. macOS -psn_* and deep links
	for len(args) > 0 {
		_ = fs.Parse(args)
		if rest := fs.Args(); len(rest) < len(args) {
			args = rest
		} else {
			args = args[1:]
		}
	}

	// Kept for restart and autostart
	Env.Args = []string{}
	fs.Visit(func(f *flag.Flag) {
		if f.Name == "data-dir" || f.Name == "portable" {
			Env.Args = append(Env.Args, "--"+f.Name+"="+f.Value.String())
		}
	})

	return dataDir, portable, restartFrom
}

func defaultDataDir() (string, error) {
	switch Env.OS {
	case "linux":
		if dataHome := os.Getenv("XDG_DATA_HOME"); filepath.IsAbs(dataHome) {
			return filepath.Join(dataHome, Env.AppId), nil
		}
		home, err := os.UserHomeDir()
		return filepath.Join(home, ".local", "share", Env.AppId), err
	case "windows":
		localAppData, err := os.UserCacheDir()
		return filepath.Join(localAppData, Env.AppId), err
	default:
		configDir, err := os.UserConfigDir()
		return filepath.Join(configDir, Env.AppId), err
	}
}

func createMacOSMenus(app *App) {
	appMenu := app.AppMenu.AddSubmenu("App")
	appMenu.AddText("Show", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.WindowShow(app.Ctx)
	})
	appMenu.AddText("Hide", keys.CmdOrCtrl("h"), func(_ *menu.CallbackData) {
		runtime.WindowHide(app.Ctx)
	})
	appMenu.AddSeparator()
	appMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.Ctx, "onExitApp")
	})

	// on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	app.AppMenu.Append(menu.EditMenu())
}

func processFixedWebView2Runtime() {
	webviewDir := filepath.Join(Env.DataDir, "WebView2")

	err := filepath.Walk(webviewDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && strings.EqualFold(info.Name(), "msedgewebview2.exe") {
			Env.WebviewPath = filepath.Dir(path)
			log.Printf("WebView2 runtime already exists at: %s", Env.WebviewPath)
			return filepath.SkipDir
		}
		return nil
	})

	if err != nil {
		log.Printf("Error during recursive search: %v\n", err)
		return
	}

	if Env.WebviewPath != "" {
		return
	}

	entries, err := os.ReadDir(webviewDir)
	if err != nil {
		log.Printf("Failed to read directory: %v\n", err)
		return
	}

	var cabFile string
	for _, e := range entries {
		if !e.IsDir() &&
			strings.HasSuffix(strings.ToLower(e.Name()), ".cab") &&
			strings.Contains(e.Name(), "Microsoft.WebView2.FixedVersionRuntime") {
			cabFile = filepath.Join(webviewDir, e.Name())
			break
		}
	}

	if cabFile == "" {
		log.Println("No WebView2 .cab file found. Skipping extraction.")
		return
	}

	log.Printf("Found CAB file: %s\n", cabFile)

	cmd := exec.Command("expand.exe", "-F:*", cabFile, webviewDir)
	SetCmdWindowHidden(cmd)

	log.Println("Extracting WebView2 Runtime...")
	if err := cmd.Run(); err != nil {
		log.Printf("Extraction failed: %v\n", err)
		return
	}

	log.Printf("WebView2 Runtime extracted successfully into: %s\n", webviewDir)
	Env.WebviewPath = strings.TrimSuffix(cabFile, ".cab")
}

func extractEmbeddedFiles(fs embed.FS) {
	iconSrc := "frontend/dist/icons"
	iconDst := "data/.cache/icons"
	imgSrc := "frontend/dist/imgs"
	imgDst := "data/.cache/imgs"

	if err := os.MkdirAll(resolvePath(iconDst), os.ModePerm); err != nil {
		log.Printf("Failed to create icon cache directory: %v", err)
	}
	if err := os.MkdirAll(resolvePath(imgDst), os.ModePerm); err != nil {
		log.Printf("Failed to create image cache directory: %v", err)
	}

	extractFiles(fs, iconSrc, iconDst)
	extractFiles(fs, imgSrc, imgDst)
}

func extractFiles(fs embed.FS, srcDir, dstDir string) {
	files, err := fs.ReadDir(srcDir)
	if err != nil {
		log.Printf("Failed to read embedded files [%s]: %v", srcDir, err)
		return
	}

	for _, file := range files {
		fileName := file.Name()
		dstPath := resolvePath(dstDir + "/" + fileName)
		if _, err := os.Stat(dstPath); os.IsNotExist(err) {
			log.Printf("InitResources [%s]: %s", dstDir, fileName)
			data, err := fs.ReadFile(srcDir + "/" + fileName)
			if err != nil {
				log.Printf("Error reading embedded file %s: %v", fileName, err)
				continue
			}
			if err := os.WriteFile(dstPath, data, os.ModePerm); err != nil {
				log.Printf("Error writing file %s: %v", dstPath, err)
			}
		}
	}
}

func loadConfig() {
	b, err := os.ReadFile(resolvePath("data/user.yaml"))
	if err == nil {
		if err := yaml.Unmarshal(b, &Config); err != nil {
			log.Printf("Failed to parse user config: %v", err)
		}
	}

	if Config.Width == 0 {
		Config.Width = 800
	}

	if Config.Height == 0 {
		Config.Height = 540
	}
}
