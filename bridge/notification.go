package bridge

import (
	"embed"
	"log"
	"os"

	"github.com/gen2brain/beeep"
)

func InitNotification(fs embed.FS) {
	icons := [3][2]string{
		{"frontend/dist/imgs/notify_success.png", "data/.cache/imgs/notify_success.png"},
		{"frontend/dist/imgs/notify_error.png", "data/.cache/imgs/notify_error.png"},
		{"frontend/dist/favicon.ico", "data/.cache/imgs/notify_normal.ico"},
	}

	os.MkdirAll(GetPath("data/.cache/imgs"), os.ModePerm)

	for _, item := range icons {
		path := GetPath(item[1])
		if _, err := os.Stat(path); os.IsNotExist(err) {
			log.Printf("InitNotification [Icon]: %s", item[1])
			b, _ := fs.ReadFile(item[0])
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
