//go:build darwin

package bridge

func (a *App) GetEnv() EnvResult {
	return EnvResult{
		AppName:  Env.AppName,
		BasePath: Env.BasePath,
		OS:       Env.OS,
		ARCH:     Env.ARCH,
	}
}

func (a *App) SetSystemProxy(enable bool, server string) FlagResult {
	return FlagResult{true, "Success"}
}

func (a *App) GetSystemProxy() FlagResult {
	return FlagResult{true, "Success"}
}

func (a *App) SwitchPermissions(enable bool, path string) FlagResult {
	return FlagResult{true, "Success"}
}

func (a *App) CheckPermissions(path string) FlagResult {
	return FlagResult{true, "Success"}
}

func (a *App) GetInterfaces() FlagResult {
	return FlagResult{true, "Success"}
}
