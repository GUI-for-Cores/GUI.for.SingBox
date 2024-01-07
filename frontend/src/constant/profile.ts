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
  enable: true,
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
    type: 'final',
    payload: '',
    proxy: '🐟 漏网之鱼'
  }
]
