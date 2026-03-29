import type { AppEnv } from '@/types/app'
import * as App from '@wails/go/bridge/App'

export const RestartApp = App.RestartApp

export const ExitApp = App.ExitApp

export const ShowMainWindow = App.ShowMainWindow

export const UpdateTray = App.UpdateTray

export const UpdateTrayMenus = App.UpdateTrayMenus

export const UpdateTrayAndMenus = App.UpdateTrayAndMenus

export const GetEnv = <T extends string | undefined = undefined>(
  key?: T,
): Promise<T extends string ? string : AppEnv> => {
  return App.GetEnv(key || '')
}

export const IsStartup = App.IsStartup

export const GetInterfaces = async () => {
  const { flag, data } = await App.GetInterfaces()
  if (!flag) {
    throw data
  }
  return data.split('|')
}
