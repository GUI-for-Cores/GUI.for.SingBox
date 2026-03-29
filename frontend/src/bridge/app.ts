import type { AppEnv } from '@/types/app'
import {
  IsNotificationAvailable,
  RequestNotificationAuthorization,
  SendNotification,
} from '@wails/runtime/runtime'
import * as App from '@wails/go/bridge/App'
import { sampleID } from '@/utils'

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

export const Notify = async (title: string, body: string) => {
  if (!(await IsNotificationAvailable())) {
    throw new Error('Notifications not available on this platform')
  }
  await RequestNotificationAuthorization()
  await SendNotification({ id: sampleID(), title, body })
}
