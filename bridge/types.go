package bridge

import (
	"context"
	"net/http"
)

// App struct
type App struct {
	Ctx context.Context
}

type EnvResult struct {
	FromTaskSch bool   `json:"-"`
	AppName     string `json:"appName"`
	BasePath    string `json:"basePath"`
	OS          string `json:"os"`
	ARCH        string `json:"arch"`
	X64Level    int    `json:"x64Level"`
}

type RequestOptions = struct {
	Proxy    string
	Insecure bool
	Timeout  int
}

type ExecOptions struct {
	Convert bool              `json:"convert"`
	Env     map[string]string `json:"env"`
}

type FlagResult struct {
	Flag bool   `json:"flag"`
	Data string `json:"data"`
}

type HTTPResult struct {
	Flag    bool        `json:"flag"`
	Status  int         `json:"status"`
	Headers http.Header `json:"headers"`
	Body    string      `json:"body"`
}

type AppConfig struct {
	WindowStartState int    `yaml:"windowStartState"`
	Width            int    `yaml:"width"`
	Height           int    `yaml:"height"`
	UserAgent        string `yaml:"userAgent"`
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

type TrayContent struct {
	Icon    string `json:"icon"`
	Title   string `json:"title"`
	Tooltip string `json:"tooltip"`
}

type WriteTracker struct {
	Total          int64
	Progress       int64
	ProgressChange string
	App            *App
}
