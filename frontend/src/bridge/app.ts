import * as Bridge from '@wails/go/bridge/App'
import {
  IsNotificationAvailable,
  RequestNotificationAuthorization,
  SendNotification,
} from '@wails/runtime/runtime'

import { sampleID } from '@/utils'

export const RestartApp = Bridge.RestartApp

export const ExitApp = Bridge.ExitApp

export const ShowMainWindow = Bridge.ShowMainWindow

export const UpdateTray = Bridge.UpdateTray

export const UpdateTrayMenus = Bridge.UpdateTrayMenus

export const UpdateTrayAndMenus = Bridge.UpdateTrayAndMenus

export const GetEnv = <T extends string | undefined = undefined>(
  key?: T,
): Promise<T extends string ? string : App.AppEnv> => {
  return Bridge.GetEnv(key || '')
}

export const IsStartup = Bridge.IsStartup

export const GetSystemProxy = async () => {
  const { flag, data } = await Bridge.GetSystemProxy()
  if (!flag) {
    throw data
  }
  return data
}

export const SetSystemProxy = async (
  enable: boolean,
  server: string,
  proxyType: 'mixed' | 'http' | 'socks' = 'mixed',
  bypass = '',
  services: string[] = [],
) => {
  const { flag, data } = await Bridge.SetSystemProxy(enable, server, proxyType, bypass, services)
  if (!flag) {
    throw data
  }
  return data
}

export const SetSystemDNS = async (servers: string, services: string[] = []) => {
  const { flag, data } = await Bridge.SetSystemDNS(servers, services)
  if (!flag) {
    throw data
  }
  return data
}

export const GetSystemProxyBypass = async () => {
  const { flag, data } = await Bridge.GetSystemProxyBypass()
  if (!flag) {
    throw data
  }
  return data
}

export const GetInterfaces = async () => {
  const { flag, data } = await Bridge.GetInterfaces()
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
