package bridge

import (
	"github.com/gen2brain/beeep"
)

func (a *App) Notify(title string, message string, icon string) FlagResult {
	fullPath := GetPath(icon)

	err := beeep.Notify(title, message, fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}
