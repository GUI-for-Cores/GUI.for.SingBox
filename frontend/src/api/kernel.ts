import { Request } from '@/utils/request'
import { WebSockets } from '@/utils/websockets'
import { useAppSettingsStore, useProfilesStore } from '@/stores'

enum Api {
  Configs = '/configs',
  Memory = '/memory',
  Proxies = '/proxies',
  Providers = '/providers/proxies',
  GroupDelay = '/group/{0}/delay',
  ProxyDelay = '/proxies/{0}/delay',
  Connections = '/connections',
  Traffic = '/traffic',
  Logs = '/logs',
  ProvidersRules = '/providers/rules'
}

const getCurrentProfile = () => {
  const appSettingsStore = useAppSettingsStore()
  const profilesStore = useProfilesStore()
  return profilesStore.getProfileById(appSettingsStore.app.kernel.profile)
}

const setupKernelApi = () => {
  let base = 'http://127.0.0.1:20123'
  let bearer = ''

  const profile = getCurrentProfile()

  if (profile) {
    const controller = profile.experimental.clash_api.external_controller || '127.0.0.1:20123'
    const [, port = 20123] = controller.split(':')
    base = `http://127.0.0.1:${port}`
    bearer = profile.experimental.clash_api.secret
  }

  request.base = base
  request.bearer = bearer
}

const setupKernelWSApi = () => {
  let base = 'ws://127.0.0.1:20123'
  let bearer = ''

  const profile = getCurrentProfile()

  if (profile) {
    const controller = profile.experimental.clash_api.external_controller || '127.0.0.1:20123'
    const [, port = 20123] = controller.split(':')
    base = `ws://127.0.0.1:${port}`
    bearer = profile.experimental.clash_api.secret
  }

  websockets.base = base
  websockets.bearer = bearer
}

const request = new Request({ beforeRequest: setupKernelApi, timeout: 60 * 1000 })

const websockets = new WebSockets({ beforeConnect: setupKernelWSApi })

export const getConfigs = () => request.get<IKernelApiConfig>(Api.Configs)

export const setConfigs = (body = {}) => request.patch<null>(Api.Configs, body)

export const getProxies = () => request.get<IKernelApiProxies>(Api.Proxies)

export const getProviders = () => request.get<IKernelApiProviders>(Api.Providers)

export const getConnections = () => request.get<IKernelApiConnections>(Api.Connections)

export const deleteConnection = (id: string) => request.delete<null>(Api.Connections + '/' + id)

export const useProxy = (group: string, proxy: string) => {
  return request.put<null>(Api.Proxies + '/' + group, { name: proxy })
}

export const getGroupDelay = (group: string, url: string) => {
  return request.get<Record<string, number>>(Api.GroupDelay.replace('{0}', group), {
    url,
    timeout: 5000
  })
}

export const getProxyDelay = (proxy: string, url: string) => {
  return request.get<Record<string, number>>(Api.ProxyDelay.replace('{0}', proxy), {
    url,
    timeout: 5000
  })
}

export const getProvidersRules = () => request.get<IKernelApiProvidersRules>(Api.ProvidersRules)

export const updateProvidersRules = (ruleset: string) => {
  return request.put<null>(Api.ProvidersRules + '/' + ruleset)
}

export const updateProvidersProxies = (provider: string) => {
  return request.put<null>(Api.Providers + '/' + provider)
}

type KernelWSOptions = {
  onConnections: (data: any) => void
  onTraffic: (data: any) => void
  onMemory: (data: any) => void
}

export const getKernelWS = ({ onConnections, onTraffic, onMemory }: KernelWSOptions) => {
  return websockets.createWS([
    { name: 'Connections', url: Api.Connections, cb: onConnections },
    { name: 'Traffic', url: Api.Traffic, cb: onTraffic },
    { name: 'Memory', url: Api.Memory, cb: onMemory }
  ])
}

export const getKernelLogsWS = (onLogs: (data: any) => void) => {
  return websockets.createWS([
    { name: 'Logs', url: Api.Logs, cb: onLogs, params: { level: 'debug' } }
  ])
}

export const getKernelConnectionsWS = (onConnections: (data: IKernelConnectionsWS) => void) => {
  return websockets.createWS([{ name: 'Connections', url: Api.Connections, cb: onConnections }])
}
