//go:build darwin

package bridge

func (a *App) QuerySchTask(taskName string) FlagResult {
	return FlagResult{true, "Success"}
}

func (a *App) CreateSchTask(taskName string, xmlPath string) FlagResult {
	return FlagResult{true, "Success"}
}

func (a *App) DeleteSchTask(taskName string) FlagResult {
	return FlagResult{true, "Success"}
}
