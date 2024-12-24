import { sampleID } from '@/utils'
import {
  LogLevel,
  Inbound,
  Outbound,
  TunStack,
  ClashMode,
  RulesetType,
  RulesetFormat,
  RuleType,
  RuleAction,
  Strategy,
} from '@/enums/kernel'
import i18n from '@/lang'
const { t } = i18n.global

const DefaultOutboundIds = {
  Select: 'outbound-select',
  Urltest: 'outbound-urlte',
  Direct: 'outbound-direct',
  Fallback: 'outbound-fallback',
  Global: 'outbound-global',
}

const DefaultInboundIds = {
  MixedIn: 'mixed-in',
  Tun: 'tun-in',
}

const DefaultRulesetIds = {
  CATEGORY_ADS: 'Category-Ads',
  GEOIP_CN: 'GeoIP-CN',
  GEOSITE_CN: 'GeoSite-CN',
  GEOLOCATION_NOT_CN: 'GeoLocation-!CN',
  GEOSITE_PRIVATE: 'GeoSite-Private',
  GEOIP_PRIVATE: 'GeoIP-Private',
}

const DefaultDnsServersIds = {
  LocalDns: 'Local-DNS',
  RemoteDns: 'Remote-DNS',
  FakeIP: 'Fake-IP',
  LocalDnsResolver: 'Local-DNS-Resolver',
  RemoteDnsResolver: 'Remote-DNS-Resolver',
}

export const DefaultLog = (): ILog => ({
  disabled: false,
  level: LogLevel.Info,
  output: '',
  timestamp: false,
})

export const DefaultExperimental = (): IExperimental => ({
  clash_api: {
    external_controller: '127.0.0.1:20123',
    external_ui: '',
    external_ui_download_url: '',
    external_ui_download_detour: DefaultOutboundIds.Direct,
    secret: sampleID(),
    default_mode: ClashMode.Rule,
    access_control_allow_origin: ['*'],
    access_control_allow_private_network: false,
  },
  cache_file: {
    enabled: true,
    path: 'cache.db',
    cache_id: '',
    store_fakeip: true,
    store_rdrc: true,
    rdrc_timeout: '7d',
  },
})

export const DefaultInboundSocks = (): IInbound['socks'] => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20120,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const DefaultInboundHttp = (): IInbound['http'] => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20121,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const DefaultInboundMixed = (): IInbound['mixed'] => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20122,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const DefaultInboundTun = (): IInbound['tun'] => ({
  interface_name: '',
  address: ['172.18.0.1/30', 'fdfe:dcba:9876::1/126'],
  mtu: 9000,
  auto_route: true,
  strict_route: true,
  route_address: ['0.0.0.0/1', '128.0.0.0/1', '::/1', '8000::/1'],
  endpoint_independent_nat: false,
  stack: TunStack.Mixed,
})

export const DefaultInbounds = (): IInbound[] => [
  {
    id: DefaultInboundIds.MixedIn,
    type: Inbound.Mixed,
    tag: 'mixed-in',
    enable: true,
    mixed: DefaultInboundMixed(),
  },
  {
    id: DefaultInboundIds.Tun,
    type: Inbound.Tun,
    tag: 'tun-in',
    enable: false,
    tun: DefaultInboundTun(),
  },
]

export const DefaultOutbound = (): IOutbound => ({
  id: sampleID(),
  tag: '',
  type: Outbound.Selector,
  outbounds: [],
  interrupt_exist_connections: true,
  url: 'https://www.gstatic.com/generate_204',
  interval: '3m',
  tolerance: 150,
  include: '',
  exclude: '',
})

export const DefaultOutbounds = (): IOutbound[] => [
  {
    id: DefaultOutboundIds.Select,
    tag: t('outbound.select'),
    type: Outbound.Selector,
    outbounds: [{ id: DefaultOutboundIds.Urltest, type: 'Built-in', tag: t('outbound.urltest') }],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
  },
  {
    id: DefaultOutboundIds.Urltest,
    tag: t('outbound.urltest'),
    type: Outbound.Urltest,
    outbounds: [],
    interrupt_exist_connections: true,
    url: 'https://www.gstatic.com/generate_204',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
  },
  {
    id: DefaultOutboundIds.Direct,
    tag: t('outbound.direct'),
    type: Outbound.Direct,
    outbounds: [],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
  },
  {
    id: DefaultOutboundIds.Fallback,
    tag: t('outbound.fallback'),
    type: Outbound.Selector,
    outbounds: [
      { id: DefaultOutboundIds.Select, type: 'Built-in', tag: t('outbound.select') },
      { id: DefaultOutboundIds.Direct, type: 'Built-in', tag: t('outbound.direct') },
    ],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
  },
  {
    id: DefaultOutboundIds.Global,
    tag: 'GLOBAL',
    type: Outbound.Selector,
    outbounds: [
      { id: DefaultOutboundIds.Select, type: 'Built-in', tag: t('outbound.select') },
      { id: DefaultOutboundIds.Urltest, type: 'Built-in', tag: t('outbound.urltest') },
      { id: DefaultOutboundIds.Direct, type: 'Built-in', tag: t('outbound.direct') },
      { id: DefaultOutboundIds.Fallback, type: 'Built-in', tag: t('outbound.fallback') },
    ],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
  },
]

export const DefaultRouteRule = (): IRule => ({
  id: sampleID(),
  type: RuleType.RuleSet,
  payload: '',
  invert: false,
  action: RuleAction.Route,
  outbound: '',
  sniffer: [],
  strategy: Strategy.Default,
  server: '',
})

export const DefaultRouteRuleset = (): IRuleSet => ({
  id: sampleID(),
  type: RulesetType.Local,
  tag: '',
  format: RulesetFormat.Binary,
  url: '',
  download_detour: '',
  update_interval: '',
  rules: '',
  path: '',
})

export const DefaultRoute = (): IRoute => ({
  rules: [
    // {
    //   id: sampleID(),
    //   type: RuleType.Inbound,
    //   payload: DefaultInboundIds.MixedIn,
    //   invert: false,
    //   action: RuleAction.Resolve,
    //   outbound: '',
    //   sniffer: [],
    //   strategy: Strategy.Default,
    //   server: ''
    // },
    {
      id: sampleID(),
      type: RuleType.Inbound,
      payload: DefaultInboundIds.Tun,
      invert: false,
      action: RuleAction.Sniff,
      outbound: '',
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.Protocol,
      payload: 'dns',
      invert: false,
      action: RuleAction.HijackDNS,
      outbound: '',
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.ClashMode,
      payload: ClashMode.Direct,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Direct,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.ClashMode,
      payload: ClashMode.Global,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Global,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.Protocol,
      payload: 'quic',
      invert: false,
      action: RuleAction.Reject,
      outbound: '',
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.RuleSet,
      payload: DefaultRulesetIds.CATEGORY_ADS,
      invert: false,
      action: RuleAction.Reject,
      outbound: '',
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.RuleSet,
      payload: DefaultRulesetIds.GEOSITE_PRIVATE,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Direct,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.RuleSet,
      payload: DefaultRulesetIds.GEOSITE_CN,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Direct,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.RuleSet,
      payload: DefaultRulesetIds.GEOIP_PRIVATE,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Direct,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.RuleSet,
      payload: DefaultRulesetIds.GEOIP_CN,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Direct,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
    {
      id: sampleID(),
      type: RuleType.RuleSet,
      payload: DefaultRulesetIds.GEOLOCATION_NOT_CN,
      invert: false,
      action: RuleAction.Route,
      outbound: DefaultOutboundIds.Select,
      sniffer: [],
      strategy: Strategy.Default,
      server: '',
    },
  ],
  rule_set: [
    {
      id: DefaultRulesetIds.CATEGORY_ADS,
      type: RulesetType.Remote,
      tag: DefaultRulesetIds.CATEGORY_ADS,
      format: RulesetFormat.Binary,
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ads-all.srs',
      download_detour: DefaultOutboundIds.Direct,
      update_interval: '',
      rules: '',
      path: '',
    },
    {
      id: DefaultRulesetIds.GEOIP_PRIVATE,
      type: RulesetType.Remote,
      tag: DefaultRulesetIds.GEOIP_PRIVATE,
      format: RulesetFormat.Binary,
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/private.srs',
      download_detour: DefaultOutboundIds.Direct,
      update_interval: '',
      rules: '',
      path: '',
    },
    {
      id: DefaultRulesetIds.GEOSITE_PRIVATE,
      type: RulesetType.Remote,
      tag: DefaultRulesetIds.GEOSITE_PRIVATE,
      format: RulesetFormat.Binary,
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/private.srs',
      download_detour: DefaultOutboundIds.Direct,
      update_interval: '',
      rules: '',
      path: '',
    },
    {
      id: DefaultRulesetIds.GEOIP_CN,
      type: RulesetType.Remote,
      tag: DefaultRulesetIds.GEOIP_CN,
      format: RulesetFormat.Binary,
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/cn.srs',
      download_detour: DefaultOutboundIds.Direct,
      update_interval: '',
      rules: '',
      path: '',
    },
    {
      id: DefaultRulesetIds.GEOSITE_CN,
      type: RulesetType.Remote,
      tag: DefaultRulesetIds.GEOSITE_CN,
      format: RulesetFormat.Binary,
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/cn.srs',
      download_detour: DefaultOutboundIds.Direct,
      update_interval: '',
      rules: '',
      path: '',
    },
    {
      id: DefaultRulesetIds.GEOLOCATION_NOT_CN,
      type: RulesetType.Remote,
      tag: DefaultRulesetIds.GEOLOCATION_NOT_CN,
      format: RulesetFormat.Binary,
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/geolocation-!cn.srs',
      download_detour: DefaultOutboundIds.Direct,
      update_interval: '',
      rules: '',
      path: '',
    },
  ],
  auto_detect_interface: true,
  default_interface: '',
  final: DefaultOutboundIds.Fallback,
})

export const DefaultDnsServer = (): IDNSServer => ({
  id: sampleID(),
  tag: '',
  address: '',
  address_resolver: '',
  detour: '',
  strategy: Strategy.Default,
  client_subnet: '',
})

export const DefaultDnsServers = (): IDNSServer[] => [
  {
    id: DefaultDnsServersIds.LocalDns,
    tag: DefaultDnsServersIds.LocalDns,
    address: 'https://223.5.5.5/dns-query',
    address_resolver: DefaultDnsServersIds.LocalDnsResolver,
    detour: DefaultOutboundIds.Direct,
    strategy: Strategy.Default,
    client_subnet: '',
  },
  {
    id: DefaultDnsServersIds.LocalDnsResolver,
    tag: DefaultDnsServersIds.LocalDnsResolver,
    address: '223.5.5.5',
    address_resolver: '',
    detour: DefaultOutboundIds.Direct,
    strategy: Strategy.Default,
    client_subnet: '',
  },
  {
    id: DefaultDnsServersIds.RemoteDns,
    tag: DefaultDnsServersIds.RemoteDns,
    address: 'tls://8.8.8.8',
    address_resolver: DefaultDnsServersIds.RemoteDnsResolver,
    detour: DefaultOutboundIds.Select,
    strategy: Strategy.Default,
    client_subnet: '',
  },
  {
    id: DefaultDnsServersIds.RemoteDnsResolver,
    tag: DefaultDnsServersIds.RemoteDnsResolver,
    address: '8.8.8.8',
    address_resolver: '',
    detour: DefaultOutboundIds.Select,
    strategy: Strategy.Default,
    client_subnet: '',
  },
  // {
  //   id: DefaultDnsServersIds.FakeIP,
  //   tag: 'fake-ip',
  //   address: 'fakeip',
  //   address_resolver: '',
  //   detour: '',
  //   strategy: Strategy.Default,
  //   client_subnet: ''
  // }
]

export const DefaultFakeIPDnsRule = () => ({
  __is_fake_ip: true,
  type: 'logical',
  mode: 'and',
  rules: [
    {
      domain_suffix: [
        '.lan',
        '.localdomain',
        '.example',
        '.invalid',
        '.localhost',
        '.test',
        '.local',
        '.home.arpa',
        '.msftconnecttest.com',
        '.msftncsi.com',
      ],
      invert: true,
    },
    {
      query_type: ['A', 'AAAA'],
    },
  ],
})

export const DefaultDnsRule = (): IDNSRule => ({
  id: sampleID(),
  type: RuleType.RuleSet,
  payload: '',
  action: RuleAction.Route,
  server: '',
})

export const DefaultDnsRules = (): IDNSRule[] => [
  {
    id: sampleID(),
    type: RuleType.Outbound,
    payload: 'any',
    action: RuleAction.Route,
    server: DefaultDnsServersIds.LocalDns,
  },
  {
    id: sampleID(),
    type: RuleType.ClashMode,
    payload: ClashMode.Direct,
    action: RuleAction.Route,
    server: DefaultDnsServersIds.LocalDns,
  },
  {
    id: sampleID(),
    type: RuleType.ClashMode,
    payload: ClashMode.Global,
    action: RuleAction.Route,
    server: DefaultDnsServersIds.RemoteDns,
  },
  {
    id: sampleID(),
    type: RuleType.RuleSet,
    payload: DefaultRulesetIds.GEOSITE_CN,
    action: RuleAction.Route,
    server: DefaultDnsServersIds.LocalDns,
  },
  {
    id: sampleID(),
    type: RuleType.RuleSet,
    payload: DefaultRulesetIds.GEOLOCATION_NOT_CN,
    action: RuleAction.Route,
    server: DefaultDnsServersIds.RemoteDns,
  },
]

export const DefaultDns = (): IDNS => ({
  servers: DefaultDnsServers(),
  rules: DefaultDnsRules(),
  fakeip: {
    enabled: false,
    inet4_range: '198.18.0.0/15',
    inet6_range: 'fc00::/18',
  },
  disable_cache: false,
  disable_expire: false,
  independent_cache: false,
  client_subnet: '',
  final: DefaultDnsServersIds.RemoteDns,
  strategy: Strategy.Default,
})

export const DefaultMixin = (): IProfile['mixin'] => {
  return { priority: 'mixin', config: '{}' }
}

export const DefaultScript = (): IProfile['script'] => {
  return { code: `const onGenerate = async (config) => {\n  return config\n}` }
}
