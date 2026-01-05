import * as App from '@wails/go/bridge/App'

export const RestartApp = App.RestartApp

export const ExitApp = App.ExitApp

export const ShowMainWindow = App.ShowMainWindow

export const UpdateTray = App.UpdateTray

export const UpdateTrayMenus = App.UpdateTrayMenus

export const UpdateTrayAndMenus = App.UpdateTrayAndMenus

export const GetEnv = App.GetEnv

export const IsStartup = App.IsStartup

export const GetInterfaces = async () => {
  const { flag, data } = await App.GetInterfaces()
  if (!flag) {
    throw data
  }
  return data.split('|')
}
