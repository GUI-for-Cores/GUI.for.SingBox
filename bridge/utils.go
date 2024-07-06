package bridge

import (
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/text/encoding/simplifiedchinese"
)

func GetPath(path string) string {
	if filepath.IsAbs(path) {
		return path
	}
	path = filepath.Join(Env.BasePath, path)
	path = filepath.Clean(path)
	return path
}

func GetProxy(_proxy string) func(*http.Request) (*url.URL, error) {
	proxy := http.ProxyFromEnvironment

	if _proxy != "" {
		if !strings.HasPrefix(_proxy, "http") {
			_proxy = "http://" + _proxy
		}
		proxyUrl, err := url.Parse(_proxy)
		if err == nil {
			proxy = http.ProxyURL(proxyUrl)
		}
	}

	return proxy
}

func GetTimeout(_timeout int) time.Duration {
	if _timeout == 0 {
		return time.Second * 15
	}
	return time.Second * time.Duration(_timeout)
}

func GetHeader(headers map[string]string) http.Header {
	header := make(http.Header)
	for key, value := range headers {
		header.Set(key, value)
	}
	return header
}

func ConvertByte2String(byte []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(byte)
	return string(decodeBytes)
}

func AddMenusForDarwin(AppMenu *menu.Menu, app *App) {
	appMenu := AppMenu.AddSubmenu("App")
	appMenu.AddText("Show", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.WindowShow(app.Ctx)
	})
	appMenu.AddText("Hide", keys.CmdOrCtrl("h"), func(_ *menu.CallbackData) {
		runtime.WindowHide(app.Ctx)
	})
	appMenu.AddSeparator()
	appMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.Ctx, "exitApp")
	})

	// on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	AppMenu.Append(menu.EditMenu())
}

func RollingRelease(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !Config.RollingRelease {
			next.ServeHTTP(w, r)
			return
		}

		url := r.URL.Path
		if url == "/" {
			url = "/index.html"
		}

		log.Printf("[Rolling Release] %v %v\n", r.Method, url)

		file := GetPath("data/rolling-release" + url)

		bytes, err := os.ReadFile(file)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		ext := path.Ext(url)
		mime := "application/octet-stream"

		switch ext {
		case ".html":
			mime = "text/html"
		case ".ico":
			mime = "image/x-icon"
		case ".png":
			mime = "image/png"
		case ".css":
			mime = "text/css"
		case ".js":
			mime = "text/javascript"
		}

		w.Header().Set("Content-Type", mime)
		w.Write(bytes)
	})
}
