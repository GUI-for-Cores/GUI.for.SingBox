type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic'
interface ILog {
  disabled: boolean
  level: LogLevel
  output: string
  timestamp: boolean
}

interface IExperimental {
  clash_api: {
    external_controller: string
    external_ui: string
    external_ui_download_url: string
    external_ui_download_detour: string
    secret: string
    default_mode: string
    access_control_allow_origin: string[]
    access_control_allow_private_network: boolean
  }
  cache_file: {
    enabled: boolean
    path: string
    cache_id: string
    store_fakeip: boolean
    store_rdrc: boolean
    rdrc_timeout: string
  }
}

interface IProxy {
  id: string
  type: string
  tag: string
}

type RuleSetType = 'inline' | 'local' | 'remote'
type RuleSetFormat = 'source' | 'binary'
interface IRuleSet {
  id: string
  type: RuleSetType
  tag: string
  // inline
  rules: string
  // local
  path: string
  // remote
  url: string
  download_detour: string
  update_interval: string
  // local or remote
  format: RuleSetFormat
}

type InboundType = 'mixed' | 'socks' | 'http' | 'tun'
type InboundListen = {
  listen: string
  listen_port: number
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  udp_fragment: boolean
}

interface IInbound {
  id: string
  type: InboundType
  tag: string
  enable: boolean
  mixed?: {
    listen: InboundListen
    users: string[]
  }
  socks?: {
    listen: InboundListen
    users: string[]
  }
  http?: {
    listen: InboundListen
    users: string[]
  }
  tun?: {
    interface_name: string
    address: string[]
    mtu: number
    auto_route: boolean
    strict_route: boolean
    route_address: string[]
    endpoint_independent_nat: boolean
    stack: TunStackEnum
  }
}

type OutboundType = 'direct' | 'selector' | 'urltest'

type RuleAction = 'route' | 'route-options' | 'reject' | 'hijack-dns' | 'sniff' | 'resolve'
type DnsRuleAction = 'route' | 'route-options' | 'reject'

interface IOutbound {
  id: string
  tag: string
  type: OutboundType
  outbounds: IProxy[]
  url: string
  interval: string
  tolerance: number
  interrupt_exist_connections: boolean
  // gui
  include: string
  exclude: string
}

type RuleType =
  | 'inbound'
  | 'network'
  | 'protocol'
  | 'domain'
  | 'domain_suffix'
  | 'domain_keyword'
  | 'domain_regex'
  | 'source_ip_cidr'
  | 'ip_cidr'
  | 'source_port'
  | 'source_port_range'
  | 'port'
  | 'port_range'
  | 'process_name'
  | 'process_path'
  | 'process_path_regex'
  | 'rule_set'
  | 'ip_is_private'
  | 'clash_mode'
  | 'outbound'
  | 'inline'

interface IRule {
  id: string
  type: RuleType
  payload: string
  invert: boolean
  action: RuleAction
  // action = route
  outbound: string
  // action = sniff
  sniffer: string[]
  // action = resolve
  strategy: Strategy
  server: string
}

interface IRoute {
  rules: IRule[]
  rule_set: IRuleSet[]
  final: string
  auto_detect_interface: boolean
  default_interface: string
}

type Strategy = 'default' | 'prefer_ipv4' | 'prefer_ipv6' | 'ipv4_only' | 'ipv6_only'

interface IDNSServer {
  id: string
  tag: string
  address: string
  address_resolver: string
  detour: string
  strategy: Strategy
  client_subnet: string
}

interface IDNSRule {
  id: string
  type: RuleType
  payload: string
  action: DnsRuleAction
  server: string
}

interface IDNS {
  servers: IDNSServer[]
  rules: IDNSRule[]
  disable_cache: boolean
  disable_expire: boolean
  independent_cache: boolean
  client_subnet: string
  fakeip: {
    enabled: boolean
    inet4_range: string
    inet6_range: string
  }
  final: string
  strategy: Strategy
}

type MixinPriority = 'mixin' | 'gui'

interface IMixin {
  priority: MixinPriority
  config: string
}

interface IScript {
  code: string
}

interface IProfile {
  id: string
  name: string
  log: ILog
  experimental: IExperimental
  inbounds: IInbound[]
  outbounds: IOutbound[]
  route: IRoute
  dns: IDNS
  mixin: IMixin
  script: IScript
}
