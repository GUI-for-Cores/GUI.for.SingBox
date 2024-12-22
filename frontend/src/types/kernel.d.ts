interface IKernelApiConfig {
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

interface IKernelProxy {
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

interface IKernelApiProxies {
  proxies: Record<string, Proxy>
}

interface IKernelApiProviders {
  providers: Record<
    string,
    {
      name: string
      proxies: Proxy[]
    }
  >
}

interface IKernelApiConnections {
  connections: {
    id: string
    chains: string[]
  }[]
}

interface IKernelConnectionsWS {
  connections: {
    id: string
    metadata: {
      network: string
      type: string
      sourceIP: string
      destinationIP: string
      sourcePort: string
      destinationPort: string
      inboundIP: string
      inboundPort: string
      inboundName: string
      inboundUser: string
      host: string
      dnsMode: string
      process: string
      processPath: string
      specialProxy: string
      specialRules: string
      remoteDestination: string
      sniffHost: string
    }
    upload: number
    download: number
    start: string
    chains: string[]
    rule: string
    rulePayload: string
  }[]
}

interface IKernelApiProvidersRules {
  providers: Record<
    string,
    {
      format: string
      name: string
      ruleCount: number
      type: string
      updatedAt: string
      vehicleType: string
    }
  >
}
