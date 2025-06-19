package bridge

import (
	"github.com/gen2brain/beeep"
)

func (a *App) Notify(title string, message string, icon string, options NotifyOptions) FlagResult {
	fullPath := GetPath(icon)

	beeep.AppName = options.AppName

	var err error
	if options.Beep {
		err = beeep.Alert(title, message, fullPath)
	} else {
		err = beeep.Notify(title, message, fullPath)
	}
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}
