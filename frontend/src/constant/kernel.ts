import { GetEnv } from '@/utils/bridge'

export enum ProxyGroup {
  Select = 'selector',
  UrlTest = 'urltest',
  Direct = 'direct',
  Dns = 'dns',
  Block = 'block'
}

// Why not unify the design with the above?
export enum ProxyGroupType {
  Selector = 'Selector',
  UrlTest = 'URLTest',
  Fallback = 'Fallback',
  Relay = 'Relay',
  LoadBalance = 'LoadBalance'
}

export enum FinalDnsType {
  Local = 'local-dns',
  Remote = 'remote-dns'
}

export const KernelWorkDirectory = 'data/sing-box'
export const KernelConfigFilePath = KernelWorkDirectory + '/config.json'

export const getKernelFileName = async (isLatest = false) => {
  const { os } = await GetEnv()
  const fileSuffix = { windows: '.exe', linux: '' }[os]
  const latest = isLatest ? '-latest' : ''
  return `sing-box${latest}${fileSuffix}`
}

export const ModeOptions = [
  {
    label: 'kernel.global',
    value: 'global',
    desp: 'kernel.globalDesp'
  },
  {
    label: 'kernel.rule',
    value: 'rule',
    desp: 'kernel.ruleDesp'
  },
  {
    label: 'kernel.direct',
    value: 'direct',
    desp: 'kernel.directDesp'
  }
]

export const LogLevelOptions = [
  {
    label: 'kernel.info',
    value: 'info'
  },
  {
    label: 'kernel.warning',
    value: 'warn'
  },
  {
    label: 'kernel.error',
    value: 'error'
  },
  {
    label: 'kernel.debug',
    value: 'debug'
  },
  {
    label: 'kernel.silent',
    value: 'panic'
  }
]

export const FindProcessModeOptions = [
  {
    label: 'kernel.always',
    value: 'always'
  },
  {
    label: 'kernel.strict',
    value: 'strict'
  },
  {
    label: 'kernel.off',
    value: 'off'
  }
]

export const GlobalClientFingerprintOptions = [
  { label: 'kernel.chrome', value: 'chrome' },
  { label: 'kernel.firefox', value: 'firefox' },
  { label: 'kernel.safari', value: 'safari' },
  { label: 'kernel.iOS', value: 'iOS' },
  { label: 'kernel.android', value: 'android' },
  { label: 'kernel.edge', value: 'edge' },
  { label: 'kernel.360', value: '360' },
  { label: 'kernel.qq', value: 'qq' },
  { label: 'kernel.random', value: 'random' }
]

export const GeodataLoaderOptions = [
  { label: 'kernel.standard', value: 'standard' },
  { label: 'kernel.memconservative', value: 'memconservative' }
]

export const GroupsTypeOptions = [
  {
    label: 'kernel.proxyGroups.type.select',
    value: ProxyGroup.Select
  },
  {
    label: 'kernel.proxyGroups.type.url-test',
    value: ProxyGroup.UrlTest
  }
]

export const StrategyOptions = [
  {
    label: 'kernel.proxyGroups.strategy.consistent-hashing',
    value: 'consistent-hashing'
  },
  {
    label: 'kernel.proxyGroups.strategy.round-robin',
    value: 'round-robin'
  }
]

export const RulesTypeOptions = [
  {
    label: 'kernel.rules.type.DOMAIN',
    value: 'domain'
  },
  {
    label: 'kernel.rules.type.DOMAIN-SUFFIX',
    value: 'domain_suffix'
  },
  {
    label: 'kernel.rules.type.DOMAIN-KEYWORD',
    value: 'domain_keyword'
  },
  {
    label: 'kernel.rules.type.DOMAIN-REGEX',
    value: 'domain_regex'
  },
  {
    label: 'kernel.rules.type.IP-CIDR',
    value: 'ip_cidr'
  },
  {
    label: 'kernel.rules.type.SRC-IP-CIDR',
    value: 'source_ip_cidr'
  },
  {
    label: 'kernel.rules.type.SRC-PORT',
    value: 'source_port'
  },
  {
    label: 'kernel.rules.type.DST-PORT',
    value: 'port'
  },
  {
    label: 'kernel.rules.type.PROCESS-NAME',
    value: 'process_name'
  },
  {
    label: 'kernel.rules.type.PROCESS-PATH',
    value: 'process_path'
  },
  {
    label: 'kernel.rules.type.RULE-SET',
    value: 'rule_set'
  },
  // To be realized
  // {
  //   label: 'kernel.rules.type.SCRIPT',
  //   value: 'SCRIPT'
  // },
  {
    label: 'kernel.rules.type.RULE-SET-URL',
    value: 'rule_set_url'
  },
  {
    label: 'kernel.rules.type.IP-PRIVATE',
    value: 'ip_is_private'
  },
  {
    label: 'kernel.rules.type.SRC-IP-PRIVATE',
    value: 'source_ip_is_private'
  },
  {
    label: 'kernel.rules.type.PROTOCOL',
    value: 'protocol'
  },
  {
    label: 'kernel.rules.type.CLASH-MODE',
    value: 'clash_mode'
  },
  {
    label: 'kernel.rules.type.MATCH',
    value: 'final'
  }
]

export const StackOptions = [
  { label: 'kernel.tun.system', value: 'System' },
  { label: 'kernel.tun.gvisor', value: 'gVisor' },
  { label: 'kernel.tun.mixed', value: 'Mixed' }
  // { label: 'kernel.tun.lwip', value: 'LWIP' }
]

export const ProxyTypeOptions = [
  {
    label: 'direct',
    value: 'direct'
  },
  {
    label: 'http',
    value: 'http'
  },
  {
    label: 'socks',
    value: 'socks'
  },
  {
    label: 'vmess',
    value: 'vmess'
  },
  {
    label: 'vless',
    value: 'vless'
  },
  {
    label: 'trojan',
    value: 'trojan'
  },
  {
    label: 'hysteria',
    value: 'hysteria'
  },
  {
    label: 'hysteria2',
    value: 'hysteria2'
  },
  {
    label: 'tuic',
    value: 'tuic'
  },
  {
    label: 'wireguard',
    value: 'wireguard'
  },
  {
    label: 'shadowsocks',
    value: 'shadowsocks'
  },
  {
    label: 'shadowtls',
    value: 'shadowtls'
  },
  {
    label: 'tuic',
    value: 'tuic'
  },
  {
    label: 'tor',
    value: 'tor'
  },
  {
    label: 'ssh',
    value: 'ssh'
  }
]

export enum RulesetFormat {
  Source = 'source',
  Binary = 'binary'
}

export const RulesetFormatOptions = [
  { label: 'ruleset.format.source', value: RulesetFormat.Source },
  { label: 'ruleset.format.binary', value: RulesetFormat.Binary }
]

export const DnsStrategyOptions = [
  { label: 'kernel.dns.strategy.prefer_ipv4', value: 'prefer_ipv4' },
  { label: 'kernel.dns.strategy.prefer_ipv6', value: 'prefer_ipv6' },
  { label: 'kernel.dns.strategy.ipv4_only', value: 'ipv4_only' },
  { label: 'kernel.dns.strategy.ipv6_only', value: 'ipv6_only' },
]

export const FinalDnsOptions = [
  { label: 'kernel.dns.local-dns', value: 'local-dns' },
  { label: 'kernel.dns.remote-dns', value: 'remote-dns' },
]