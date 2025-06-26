package bridge

import (
	"context"
	"net/http"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

// App struct
type App struct {
	Ctx     context.Context
	AppMenu *menu.Menu
}

type EnvResult struct {
	IsStartup   bool   `json:"-"`
	FromTaskSch bool   `json:"-"`
	AppName     string `json:"appName"`
	BasePath    string `json:"basePath"`
	OS          string `json:"os"`
	ARCH        string `json:"arch"`
	X64Level    int    `json:"x64Level"`
}

type RequestOptions struct {
	Proxy     string
	Insecure  bool
	Redirect  bool
	Timeout   int
	CancelId  string
	FileField string
}

type ExecOptions struct {
	StopOutputKeyword string            `json:"stopOutputKeyword"`
	Convert           bool              `json:"convert"`
	Env               map[string]string `json:"env"`
}

type IOOptions struct {
	Mode string // Binary / Text
}

type FlagResult struct {
	Flag bool   `json:"flag"`
	Data string `json:"data"`
}

type ServerOptions struct {
	Cert          string `json:"Cert"`
	Key           string `json:"Key"`
	StaticPath    string `json:"StaticPath"`
	StaticRoute   string `json:"StaticRoute"`
	UploadPath    string `json:"UploadPath"`
	UploadRoute   string `json:"UploadRoute"`
	MaxUploadSize int64  `json:"MaxUploadSize"`
}

type NotifyOptions struct {
	AppName string `json:"AppName"`
	Beep    bool   `json:"Beep"`
}

type HTTPResult struct {
	Flag    bool        `json:"flag"`
	Status  int         `json:"status"`
	Headers http.Header `json:"headers"`
	Body    string      `json:"body"`
}

type AppConfig struct {
	WindowStartState int  `yaml:"windowStartState"`
	WebviewGpuPolicy int  `yaml:"webviewGpuPolicy"`
	Width            int  `yaml:"width"`
	Height           int  `yaml:"height"`
	MultipleInstance bool `yaml:"multipleInstance"`
	RollingRelease   bool `yaml:"rollingRelease" default:"true"`
	StartHidden      bool
}

type TrayContent struct {
	Icon    string `json:"icon"`
	Title   string `json:"title"`
	Tooltip string `json:"tooltip"`
}

type WriteTracker struct {
	Total          int64
	Progress       int64
	LastEmitted    int64
	EmitThreshold  int64
	ProgressChange string
	App            *App
}

type MenuItem struct {
	Type     string     `json:"type"` // Menu Type: item / separator
	Text     string     `json:"text"`
	Tooltip  string     `json:"tooltip"`
	Event    string     `json:"event"`
	Children []MenuItem `json:"children"`
	Hidden   bool       `json:"hidden"`
	Checked  bool       `json:"checked"`
}
