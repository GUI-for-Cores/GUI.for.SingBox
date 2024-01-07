import { sampleID } from '@/utils'
import type { ProfileType } from '@/stores'
import { ProxyGroup, FinalDnsType } from '@/constant'

export const GeneralConfigDefaults: ProfileType['generalConfig'] = {
  mode: 'rule',
  'mixed-port': 20122,
  'allow-lan': false,
  'log-level': 'info',
  'interface-name': 'Auto'
}

export const AdvancedConfigDefaults = (): ProfileType['advancedConfig'] => ({
  port: 0,
  'socks-port': 0,
  secret: sampleID(),
  'external-controller': '127.0.0.1:20123',
  'external-ui': '',
  'external-ui-url': '',
  profile: {
    'store-cache': true,
    'store-fake-ip': false
  },
  'tcp-fast-open': false,
  'tcp-multi-path': false,
  'udp-fragment': false,
  'sniff': true,
  'sniff-override-destination': false
})

export const TunConfigDefaults: ProfileType['tunConfig'] = {
  enable: false,
  stack: 'System',
  'auto-route': true,
  interface_name: 'singbox',
  mtu: 9000,
  'strict-route': true,
  'endpoint-independent-nat': false
}

export const DnsConfigDefaults: ProfileType['dnsConfig'] = {
  enable: true,
  fakeip: false,
  strategy: 'prefer_ipv4',
  'local-dns': 'https://223.5.5.5/dns-query',
  'remote-dns': 'tls://8.8.8.8',
  'resolver-dns': '223.5.5.5',
  'remote-resolver-dns': '8.8.8.8',
  'final-dns': FinalDnsType.Remote,
  'remote-dns-detour': '🚀 节点选择',
  'fake-ip-range-v4': '198.18.0.1/16',
  'fake-ip-range-v6': 'fc00::/18',
  'fake-ip-filter': [
    '.lan',
    '.localdomain',
    '.example',
    '.invalid',
    '.localhost',
    '.test',
    '.local',
    '.home.arpa',
    '.msftconnecttest.com',
    '.msftncsi.com'
  ]
}

export const ProxyGroupsConfigDefaults = (): ProfileType['proxyGroupsConfig'] => {
  const id1 = sampleID() // 🚀 节点选择
  const id2 = sampleID() // 🎈 自动选择
  const id3 = sampleID() // 🎯 全球直连
  const id4 = sampleID() // 🛑 全球拦截
  const id5 = sampleID() // 🐟 漏网之鱼

  return [
    {
      id: id1,
      tag: '🚀 节点选择',
      type: ProxyGroup.Select,
      proxies: [{ id: id2, type: 'built-in', tag: '🎈 自动选择' }],
      use: [],
      url: '',
      interval: 300,
      tolerance: 150
    },
    {
      id: id2,
      tag: '🎈 自动选择',
      type: ProxyGroup.UrlTest,
      proxies: [],
      use: [],
      url: 'https://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 150
    },
    {
      id: id3,
      tag: '🎯 全球直连',
      type: ProxyGroup.Select,
      proxies: [
        { id: 'direct', type: 'built-in', tag: 'direct' },
        { id: 'block', type: 'built-in', tag: 'block' }
      ],
      use: [],
      url: '',
      interval: 300,
      tolerance: 150
    },
    {
      id: id4,
      tag: '🛑 全球拦截',
      type: ProxyGroup.Select,
      proxies: [
        { id: 'block', type: 'built-in', tag: 'block' },
        { id: 'direct', type: 'built-in', tag: 'direct' }
      ],
      use: [],
      url: '',
      interval: 300,
      tolerance: 150
    },
    {
      id: id5,
      tag: '🐟 漏网之鱼',
      type: ProxyGroup.Select,
      proxies: [
        { id: id1, type: 'built-in', tag: '🚀 节点选择' },
        { id: id3, type: 'built-in', tag: '🎯 全球直连' }
      ],
      use: [],
      url: '',
      interval: 300,
      tolerance: 150
    }
  ]
}

export const RulesConfigDefaults = (): ProfileType['rulesConfig'] => [
  {
    id: sampleID(),
    type: 'protocol',
    payload: 'dns',
    proxy: 'dns-out',
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': '',
    invert: false
  },
  {
    id: sampleID(),
    type: 'port',
    payload: '53',
    proxy: 'dns-out',
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': '',
    invert: false
  },  
  {
    id: sampleID(),
    type: 'clash_mode',
    payload: 'direct',
    proxy: '🎯 全球直连',
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': '',
    invert: false
  },
  {
    id: sampleID(),
    type: 'clash_mode',
    payload: 'global',
    proxy: '🚀 节点选择',
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': '',
    invert: false
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ads-all.srs',
    proxy: '🛑 全球拦截',
    'ruleset-name': 'CATEGORY-ADS',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
    invert: false
  },
  {
    id: sampleID(),
    type: 'ip_is_private',
    payload: '',
    proxy: '🎯 全球直连',
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': '',
    invert: false
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/cn.srs',
    proxy: '🎯 全球直连',
    'ruleset-name': 'GEOIP-CN',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
    invert: false
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/cn.srs',
    proxy: '🎯 全球直连',
    'ruleset-name': 'GEOSITE-CN',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
    invert: false
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/geolocation-!cn.srs',
    proxy: '🎯 全球直连',
    'ruleset-name': 'GEOLOCATION-!CN',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
    invert: true
  },
  {
    id: sampleID(),
    type: 'final',
    payload: '',
    proxy: '🐟 漏网之鱼',
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': '',
    invert: false
  }
]

export const DnsRulesConfigDefaults = (): ProfileType['dnsRulesConfig'] => [
  {
    id: sampleID(),
    type: 'outbound',
    payload: 'any',
    server: 'local-dns',
    invert: false,
    'disable-cache': true,
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': ''
  },
  {
    id: sampleID(),
    type: 'fakeip',
    payload: '',
    server: 'fakeip-dns',
    invert: false,
    'disable-cache': false,
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': ''
  },
  {
    id: sampleID(),
    type: 'clash_mode',
    payload: 'direct',
    server: 'local-dns',
    invert: false,
    'disable-cache': false,
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': ''
  },
  {
    id: sampleID(),
    type: 'clash_mode',
    payload: 'global',
    server: 'remote-dns',
    invert: false,
    'disable-cache': false,
    'ruleset-name': '',
    'ruleset-format': '',
    'download-detour': ''
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/cn.srs',
    server: 'local-dns',
    'disable-cache': false,
    invert: false,
    'ruleset-name': 'GEOSITE-CN',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/geolocation-!cn.srs',
    server: 'local-dns',
    'disable-cache': false,
    invert: true,
    'ruleset-name': 'GEOLOCATION-!CN',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
  },
  {
    id: sampleID(),
    type: 'rule_set_url',
    payload: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/geolocation-!cn.srs',
    server: 'remote-dns',
    'disable-cache': false,
    invert: false,
    'ruleset-name': 'GEOLOCATION-!CN',
    'ruleset-format': 'binary',
    'download-detour': '🎯 全球直连',
  },
]