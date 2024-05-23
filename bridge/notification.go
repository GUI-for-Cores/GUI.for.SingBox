package bridge

import (
	"embed"
	"os"

	"github.com/gen2brain/beeep"
)

func InitNotification(fs embed.FS) {
	icons := [3][2]string{
		{"frontend/dist/notify_success.png", "data/.cache/notify_success.png"},
		{"frontend/dist/notify_error.png", "data/.cache/notify_error.png"},
		{"frontend/dist/favicon.ico", "data/.cache/favicon.ico"},
	}

	os.Mkdir("data/.cache", os.ModePerm)

	for _, item := range icons {
		if _, err := os.Stat(item[1]); os.IsNotExist(err) {
			b, _ := fs.ReadFile(item[0])
			path := GetPath(item[1])
			os.WriteFile(path, b, os.ModePerm)
		}
	}
}

func (a *App) Notify(title string, message string, icon string) FlagResult {
	path := GetPath(icon)
	err := beeep.Notify(title, message, path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, "Success"}
}
