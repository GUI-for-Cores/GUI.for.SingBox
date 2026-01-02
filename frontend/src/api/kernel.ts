import { Request } from '@/api/request'
import { WebSockets } from '@/api/websocket'
import { useProfilesStore } from '@/stores'
import { setIntervalImmediately } from '@/utils'

import type {
  CoreApiConfig,
  CoreApiProxies,
  CoreApiConnections,
  CoreApiLogsData,
  CoreApiMemoryData,
  CoreApiTrafficData,
  CoreApiConnectionsData,
} from '@/types/kernel'

type WsInstance = { setup?: () => void; cleanup?: () => void; timer?: number }

export enum Api {
  Configs = '/configs',
  Memory = '/memory',
  Proxies = '/proxies',
  ProxyDelay = '/proxies/{0}/delay',
  Connections = '/connections',
  Traffic = '/traffic',
  Logs = '/logs',
}

const setupCoreApi = (protocol: 'http' | 'ws') => {
  const { currentProfile: profile } = useProfilesStore()

  let base = `${protocol}://127.0.0.1:20123`
  let bearer = ''

  if (profile) {
    const controller = profile.experimental.clash_api.external_controller || '127.0.0.1:20123'
    const [, port = 20123] = controller.split(':')
    base = `${protocol}://127.0.0.1:${port}`
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

const longLivedWS: WsInstance = { setup: undefined, cleanup: undefined, timer: -1 }
const shortLivedWS: WsInstance = { setup: undefined, cleanup: undefined, timer: -1 }

const websocketHandlers = {
  logs: [] as ((data: CoreApiLogsData) => void)[],
  memory: [] as ((data: CoreApiMemoryData) => void)[],
  traffic: [] as ((data: CoreApiTrafficData) => void)[],
  connections: [] as ((data: CoreApiConnectionsData) => void)[],
} as const

const createCoreWSHandlerRegister = <S extends C[], C>(source: S, events: WsInstance = {}) => {
  const register = (cb: S[number]) => {
    source.push(cb)
    source.length === 1 && events.setup?.()
    const unregister = () => {
      const idx = source.indexOf(cb)
      idx !== -1 && source.splice(idx, 1)
      source.length === 0 && events.cleanup?.()
    }
    return unregister
  }
  return register
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
export const getProxyDelay = (proxy: string, url: string) => {
  return request.get<Record<string, number>>(Api.ProxyDelay.replace('{0}', proxy), {
    url,
    timeout: 5000,
  })
}

// websocket api
export const onLogs = createCoreWSHandlerRegister(websocketHandlers.logs, shortLivedWS)
export const onMemory = createCoreWSHandlerRegister(websocketHandlers.memory)
export const onTraffic = createCoreWSHandlerRegister(websocketHandlers.traffic)
export const onConnections = createCoreWSHandlerRegister(websocketHandlers.connections)
export const connectWebsocket = () => {
  const { connect: connectLongLived, disconnect: disconnectLongLived } = websocket.createWS([
    {
      name: Api.Memory,
      url: Api.Memory,
      cb: (data) => websocketHandlers.memory.forEach((cb) => cb(data)),
    },
    {
      name: Api.Traffic,
      url: Api.Traffic,
      cb: (data) => websocketHandlers.traffic.forEach((cb) => cb(data)),
    },
    {
      name: Api.Connections,
      url: Api.Connections,
      cb: (data) => websocketHandlers.connections.forEach((cb) => cb(data)),
    },
  ])

  const { connect: connectShortLived, disconnect: disconnectShortLived } = websocket.createWS([
    {
      name: Api.Logs,
      url: Api.Logs,
      params: { level: 'debug' },
      cb: (data) => websocketHandlers.logs.forEach((cb) => cb(data)),
    },
  ])

  longLivedWS.setup = () => {
    longLivedWS.timer = setIntervalImmediately(connectLongLived, 30_000)
  }
  longLivedWS.cleanup = () => {
    clearInterval(longLivedWS.timer)
    disconnectLongLived()
  }

  shortLivedWS.setup = () => {
    shortLivedWS.timer = setIntervalImmediately(connectShortLived, 30_000)
  }
  shortLivedWS.cleanup = () => {
    clearInterval(shortLivedWS.timer)
    disconnectShortLived()
  }

  longLivedWS.setup()
}
export const disconnectWebsocket = () => {
  longLivedWS.cleanup?.()
  shortLivedWS.cleanup?.()
}
