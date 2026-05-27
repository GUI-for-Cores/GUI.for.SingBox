import { Request } from '@/api/request'
import { WebSockets } from '@/api/websocket'
import { useProfilesStore } from '@/stores'
import { formatProxyHost, normalizeProxyHost } from '@/utils'

import type {
  CoreApiConfig,
  CoreApiProxies,
  CoreApiConnections,
  CoreApiWsDataMap,
} from '@/types/kernel'

type WsKey = keyof CoreApiWsDataMap
type WsChannel<K extends WsKey> = {
  url: string
  params?: Recordable
  handlers: Array<(data: CoreApiWsDataMap[K]) => void>
  isActive: boolean
  connect?: () => void
  disconnect?: () => void
}

export enum Api {
  Configs = '/configs',
  Memory = '/memory',
  Proxies = '/proxies',
  ProxyDelay = '/proxies/{0}/delay',
  Connections = '/connections',
  Traffic = '/traffic',
  Logs = '/logs',
}

const resolveController = (controller: string, defaultPort: number) => {
  const trimmed = controller.trim()
  if (!trimmed) {
    return {
      host: '127.0.0.1',
      port: defaultPort,
    }
  }

  if (trimmed.startsWith('[')) {
    const match = trimmed.match(/^\[([^\]]+)\](?::(\d+))?$/)
    return {
      host: normalizeProxyHost(match?.[1] || ''),
      port: Number(match?.[2] || defaultPort),
    }
  }

  const separatorIndex = trimmed.lastIndexOf(':')
  if (separatorIndex === -1) {
    return {
      host: normalizeProxyHost(trimmed),
      port: defaultPort,
    }
  }

  return {
    host: normalizeProxyHost(trimmed.slice(0, separatorIndex).trim()),
    port: Number(trimmed.slice(separatorIndex + 1)) || defaultPort,
  }
}

const setupCoreApi = (protocol: 'http' | 'ws') => {
  const { currentProfile: profile } = useProfilesStore()

  let base = `${protocol}://127.0.0.1:20123`
  let bearer = ''

  if (profile) {
    const controller = profile.experimental.clash_api.external_controller || '127.0.0.1:20123'
    const { host, port } = resolveController(controller, 20123)
    base = `${protocol}://${formatProxyHost(host)}:${port}`
    bearer = profile.experimental.clash_api.secret
  }

  if (protocol === 'http') {
    request.base = base
    request.bearer = bearer
  } else {
    websocket.base = base
    websocket.bearer = bearer
  }
}

const request = new Request({ beforeRequest: () => setupCoreApi('http'), timeout: 60 * 1000 })
const websocket = new WebSockets({ beforeConnect: () => setupCoreApi('ws') })

const wsChannels: {
  [K in WsKey]: WsChannel<K>
} = {
  logs: { url: Api.Logs, isActive: false, handlers: [], params: { level: 'debug' } },
  memory: { url: Api.Memory, isActive: false, handlers: [] },
  traffic: { url: Api.Traffic, isActive: false, handlers: [] },
  connections: { url: Api.Connections, isActive: false, handlers: [] },
}

const createCoreWSHandlerRegister = <K extends WsKey>(key: K) => {
  const channel = wsChannels[key]

  return (cb: (data: CoreApiWsDataMap[K]) => void) => {
    channel.handlers.push(cb)

    if (!channel.isActive && channel.connect) {
      channel.connect()
      channel.isActive = true
    }

    const unregister = () => {
      const idx = channel.handlers.indexOf(cb)
      idx !== -1 && channel.handlers.splice(idx, 1)
      if (channel.isActive && channel.disconnect && channel.handlers.length === 0) {
        channel.disconnect()
        channel.isActive = false
      }
    }
    return unregister
  }
}

// restful api
export const getConfigs = () => request.get<CoreApiConfig>(Api.Configs)
export const setConfigs = (body = {}) => request.patch<null>(Api.Configs, body)
export const getProxies = () => request.get<CoreApiProxies>(Api.Proxies)
export const getConnections = () => request.get<CoreApiConnections>(Api.Connections)
export const deleteConnection = (id: string) => request.delete<null>(Api.Connections + '/' + id)
export const useProxy = (group: string, proxy: string) => {
  return request.put<null>(Api.Proxies + '/' + group, { name: proxy })
}
export const getProxyDelay = (proxy: string, url: string, timeout: number) => {
  return request.get<Record<string, number>>(Api.ProxyDelay.replace('{0}', proxy), {
    url,
    timeout,
  })
}

// websocket api
export const onLogs = createCoreWSHandlerRegister('logs')
export const onMemory = createCoreWSHandlerRegister('memory')
export const onTraffic = createCoreWSHandlerRegister('traffic')
export const onConnections = createCoreWSHandlerRegister('connections')
export const initWebsocket = () => {
  Object.values(wsChannels).forEach((channel) => {
    const { connect, disconnect } = websocket.createWS({
      url: channel.url,
      params: channel.params,
      cb: (data) => channel.handlers.forEach((cb) => cb(data)),
    })
    channel.connect = connect
    channel.disconnect = disconnect
    channel.isActive = false
    if (channel.handlers.length > 0) {
      channel.connect()
      channel.isActive = true
    }
  })
}
export const destroyWebsocket = () => {
  Object.values(wsChannels).forEach((channel) => {
    channel.disconnect?.()
    channel.connect = undefined
    channel.disconnect = undefined
    channel.isActive = false
  })
}
