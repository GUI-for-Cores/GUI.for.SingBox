import { RuleAction, Strategy } from '@/enums/kernel'
import { useRulesetsStore, useSubscribesStore } from '@/stores'

export const transformProfileV189To190 = (config: Recordable) => {
  const rulesetsStore = useRulesetsStore()
  const subscribesStore = useSubscribesStore()

  const getOutbound = (id: string) => {
    const tag = config.proxyGroupsConfig.find((group: any) => group.id === id)?.tag
    return tag
  }

  const getRuleSet = (id: string) => {
    const tag = rulesets.find((rule) => rule.id === id)?.tag
    return tag
  }

  const local_rule_sets: IRuleSet[] = [...config.rulesConfig, ...config.dnsRulesConfig]
    .filter((rule) => rule.type === 'rule_set')
    .map((rule) => {
      const ruleset = rulesetsStore.getRulesetById(rule.payload)
      return {
        id: rule.id,
        type: 'local',
        tag: ruleset?.tag || rule.id,
        format: ruleset?.format || 'binary',
        url: ruleset?.url || '',
        download_detour: getOutbound(rule['download-detour']),
        update_interval: '',
        rules: '',
        path: '',
      }
    })

  const remote_rule_sets: IRuleSet[] = [...config.rulesConfig, ...config.dnsRulesConfig]
    .filter((rule) => rule.type === 'rule_set_url')
    .map((rule) => {
      return {
        id: rule.id,
        type: 'remote',
        tag: rule['ruleset-name'],
        format: rule['ruleset-format'],
        url: rule.payload,
        download_detour: getOutbound(rule['download-detour']),
        update_interval: '',
        rules: '',
        path: '',
      }
    })

  const rulesets = [...remote_rule_sets, ...local_rule_sets]

  const profile: IProfile = {
    id: config.id,
    name: config.name,
    log: {
      disabled: false,
      level: config.generalConfig['log-level'],
      output: '',
      timestamp: false,
    },
    experimental: {
      clash_api: {
        external_controller: config.advancedConfig['external-controller'] || '127.0.0.1:20123',
        external_ui: config.advancedConfig['external-ui'] || '',
        external_ui_download_url: config.advancedConfig['external-ui-url'] || '',
        external_ui_download_detour: '',
        secret: config.advancedConfig['secret'],
        default_mode: config.generalConfig.mode,
        access_control_allow_origin: ['*'],
        access_control_allow_private_network: false,
      },
      cache_file: {
        enabled: config.advancedConfig.profile['store-cache'],
        path: 'cache.db',
        cache_id: '',
        store_fakeip: config.advancedConfig.profile['store-fake-ip'],
        store_rdrc: config.advancedConfig.profile['store-rdrc'],
        rdrc_timeout: '7d',
      },
    },
    inbounds: [
      {
        id: 'mixed-in',
        type: 'mixed',
        tag: 'mixed-in',
        enable: true,
        mixed: {
          listen: {
            listen: '127.0.0.1',
            listen_port: config.generalConfig['mixed-port'] || 20122,
            tcp_fast_open: config.advancedConfig['tcp-fast-open'],
            tcp_multi_path: config.advancedConfig['tcp-multi-path'],
            udp_fragment: config.advancedConfig['udp-fragment'],
          },
          users: [],
        },
      },
      {
        id: 'tun-in',
        type: 'tun',
        tag: 'tun-in',
        enable: config.tunConfig['enable'],
        tun: {
          interface_name: config.tunConfig['interface-name'] || '',
          address: config.tunConfig['address'],
          mtu: config.tunConfig.mtu,
          auto_route: config.tunConfig['auto-route'],
          strict_route: config.tunConfig['strict-route'],
          route_address: config.tunConfig['address'],
          endpoint_independent_nat: config.tunConfig['endpoint-independent-nat'],
          stack: 'mixed',
        },
      },
    ],
    outbounds: config.proxyGroupsConfig.flatMap((group: any) => {
      if (!['selector', 'direct', 'urltest'].includes(group.type)) return []
      return {
        id: group.id,
        tag: group.tag,
        type: group.type,
        outbounds: [
          ...group.proxies.flatMap((proxy: any) => {
            if (['block', 'direct'].includes(proxy.tag)) return []
            return {
              id: proxy.type === 'built-in' ? proxy.id : proxy.type,
              tag: proxy.tag,
              type: proxy.type === 'built-in' ? 'Built-in' : 'Subscription',
            }
          }),
          ...group.use.flatMap((use: any) => {
            const sub = subscribesStore.getSubscribeById(use)
            if (!sub) return []
            return {
              id: sub.id,
              tag: sub.name,
              type: 'Subscription',
            }
          }),
        ],
        interrupt_exist_connections: true,
        url: group.url,
        interval: '3m',
        tolerance: group.tolerance,
        include: group.filter,
        exclude: '',
      }
    }),
    route: {
      rule_set: rulesets,
      rules: config.rulesConfig.map((rule: any) => {
        return {
          id: rule.id,
          type: rule.type,
          payload: rule.payload,
          invert: rule.invert,
          action: rule.proxy === 'block' ? RuleAction.Reject : RuleAction.Route,
          outbound: getOutbound(rule.proxy),
          sniffer: [],
          strategy: Strategy.Default,
          server: '',
        }
      }),
      auto_detect_interface: true,
      default_interface: config.generalConfig['interface-name'],
      final: config.rulesConfig.find((v: any) => v.type === 'final')?.proxy || '',
    },
    dns: {
      servers: [
        {
          id: 'remote-dns',
          tag: 'remote-dns',
          address: config.dnsConfig['remote-dns'],
          address_resolver: 'resolver-dns',
          detour: config.dnsConfig['remote-dns-detour'],
          strategy: Strategy.Default,
          client_subnet: '',
        },
        {
          id: 'local-dns',
          tag: 'local-dns',
          address: config.dnsConfig['local-dns'],
          address_resolver: 'resolver-dns',
          detour: getOutbound(config.dnsConfig['local-dns-detour']),
          strategy: Strategy.Default,
          client_subnet: '',
        },
        {
          id: 'resolver-dns',
          tag: 'resolver-dns',
          address: config.dnsConfig['resolver-dns'],
          address_resolver: '',
          detour: getOutbound(config.dnsConfig['remote-dns-detour']),
          strategy: Strategy.Default,
          client_subnet: '',
        },
        {
          id: 'remote-resolver-dns',
          tag: 'remote-resolver-dns',
          address: config.dnsConfig['remote-resolver-dns'],
          address_resolver: '',
          detour: '',
          strategy: Strategy.Default,
          client_subnet: '',
        },
      ],
      rules: config.dnsRulesConfig.map((rule: any, index: number) => {
        const extra: Recordable = {}
        if (rule.type === 'rule_set_url' || rule.type === 'rule_set') {
          extra.type = 'rule_set'
          extra.payload = getRuleSet(rule.id)
        } else {
          extra.payload = rule.payload
        }
        return {
          id: index,
          type: rule.type,
          action: rule.server === 'block' ? RuleAction.Reject : RuleAction.Route,
          server: rule.server === 'block' ? '' : rule.server,
          invert: rule.invert,
          ...extra,
        }
      }),
      fakeip: {
        enabled: config.dnsConfig['fakeip'],
        inet4_range: config.dnsConfig['fake-ip-range-v4'],
        inet6_range: config.dnsConfig['fake-ip-range-v6'],
      },
      disable_cache: config.dnsConfig['disable-cache'],
      disable_expire: config.dnsConfig['disable-expire'],
      independent_cache: config.dnsConfig['independent-cache'],
      client_subnet: config.dnsConfig['client-subnet'],
      final: config.dnsConfig['final-dns'],
      strategy: config.dnsConfig['strategy'],
    },
    mixin: config.mixinConfig,
    script: config.scriptConfig,
  }

  return profile
}
