export interface CoreApiConfig {
  port: number
  'socks-port': number
  'mixed-port': number
  'interface-name': string
  'allow-lan': boolean
  mode: string
  tun: {
    enable: boolean
    stack: string
    device: string
  }
}

export interface CoreApiProxy {
  alive: boolean
  all: string[]
  name: string
  now: string
  type: string
  udp: boolean
  history: {
    delay: number
  }[]
}

export interface CoreApiProxies {
  proxies: Record<string, Proxy>
}

export interface CoreApiConnections {
  connections: {
    id: string
    chains: string[]
  }[]
}

export interface CoreApiTrafficData {
  down: number
  up: number
}

export interface CoreApiMemoryData {
  inuse: number
  oslimit: number
}

export interface CoreApiLogsData {
  type: string
  payload: string
}

export interface CoreApiConnectionsData {
  memory: number
  uploadTotal: number
  downloadTotal: number
  connections: {
    chains: string[]
    download: number
    id: string
    metadata: {
      destinationIP: string
      destinationPort: string
      dnsMode: string
      host: string
      network: string
      processPath: string
      sourceIP: string
      sourcePort: string
      type: string
    }
    rule: string
    rulePayload: string
    start: string
    upload: number
  }[]
}
