package bridge

import (
	"github.com/gen2brain/beeep"
)

func (a *App) Notify(title string, message string, icon string) FlagResult {
	path := GetPath(icon)
	err := beeep.Notify(title, message, path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, "Success"}
}
