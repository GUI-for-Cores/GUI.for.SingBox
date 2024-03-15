package bridge

import "github.com/gen2brain/beeep"

func (a *App) Notify(title string, message string, icon string) FlagResult {
	err := beeep.Notify(title, message, icon)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, "Success"}
}
