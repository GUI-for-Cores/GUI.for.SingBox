import { Readfile, Writefile } from '@/utils/bridge'
import { deepClone, ignoredError } from '@/utils'
import { KernelConfigFilePath, ProxyGroup } from '@/constant/kernel'
import { type ProfileType, useSubscribesStore, useRulesetsStore, usePluginsStore } from '@/stores'
import { TunConfigDefaults } from '@/constant'

const generateCommonRule = (rule: Record<string, any>) => {
  const { type, payload, invert } = rule

  const invertConfig = invert ? { invert: invert } : {}

  if (type === 'rule_set') {
    const rulesetsStore = useRulesetsStore()
    const ruleset = rulesetsStore.getRulesetById(payload)
    if (ruleset) {
      return { rule_set: ruleset.tag, ...invertConfig }
    } else {
      return null
    }
  } else if (type === 'rule_set_url') {
    if (!rule['ruleset-name']) {
      return null
    }
    return { rule_set: rule['ruleset-name'], ...invertConfig }
  } else if (type === 'inline') {
    if (!rule.payload) {
      return null
    }
    return { ...JSON.parse(rule.payload), ...invertConfig }
  } else if (['ip_is_private', 'src_ip_is_private'].includes(type)) {
    const this_rule: Record<string, any> = {}
    this_rule[type] = !invert
    return {
      ...this_rule
    }
  }

  const payloadsRule: Record<string, any> = {}
  const payloadsList: string[] = payload.split(',')

  let payloads = []
  if (['port', 'source_port', 'ip_version'].includes(type)) {
    payloads = payloadsList.map((r) => parseInt(r.trim()))
  } else {
    payloads = payloadsList.map((r) => r.trim())
  }

  payloadsRule[type] = payloads.length == 1 ? payloads[0] : payloads
  return {
    ...payloadsRule,
    ...invertConfig
  }
}

export const generateRule = (rule: ProfileType['rulesConfig'][0]) => {
  const common_rule = generateCommonRule(rule)
  if (common_rule) {
    return {
      ...common_rule,
      outbound: rule.proxy
    }
  }
  return common_rule
}

export const generateDnsRule = (rule: ProfileType['dnsRulesConfig'][0]) => {
  const common_rule = generateCommonRule(rule)
  if (common_rule) {
    return {
      ...common_rule,
      ...(rule['disable-cache'] ? { disable_cache: true } : {}),
      server: rule.server
    }
  }
  return common_rule
}

type ProxiesType = { type: string; tag: string }

const generateRuleSets = async (
  rules: ProfileType['rulesConfig'],
  dnsRules: ProfileType['dnsRulesConfig']
) => {
  const rulesetsStore = useRulesetsStore()
  const ruleSets: {
    tag: string
    type: string
    format: string
    path?: string
    url?: string
    download_detour?: string
  }[] = []

  const usedRuleSets = new Set<string>()

  const allRules = [...rules, ...dnsRules]

  allRules
    .filter((rule) => rule.type === 'rule_set')
    .forEach((rule) => {
      const ruleset = rulesetsStore.getRulesetById(rule.payload)
      if (ruleset && !usedRuleSets.has(ruleset.tag)) {
        usedRuleSets.add(ruleset.tag)
        ruleSets.push({
          tag: ruleset.tag,
          type: 'local',
          format: ruleset.format,
          path: ruleset.path.replace('data/', '../')
        })
      }
    })

  allRules
    .filter((rule) => rule.type === 'rule_set_url')
    .forEach((rule) => {
      const tag = rule['ruleset-name']
      if (tag && !usedRuleSets.has(tag)) {
        usedRuleSets.add(tag)
        ruleSets.push({
          tag: tag,
          type: 'remote',
          format: rule['ruleset-format'],
          url: rule.payload,
          download_detour: rule['download-detour']
        })
      }
    })
  return ruleSets
}

const generateDnsRulesWithFakeIp = async (profile: ProfileType) => {
  let hasFakeIpRule = false

  const rules = profile.dnsRulesConfig
    .filter((item) => {
      if (item.type === 'final') {
        return false
      }
      if (item.type === 'fakeip') {
        if (hasFakeIpRule) {
          return false
        }
        hasFakeIpRule = true
      }
      return true
    })
    .map((rule) => generateDnsRule(rule))
    .filter((v) => v != null) as Record<string, any>[]

  if (hasFakeIpRule) {
    const idx = rules.findIndex((item) => item['fakeip'] !== undefined)

    if (idx >= 0) {
      const invert = rules[idx]['invert'] ? { invert: true } : {}
      const disable_cache = rules[idx]['disable_cache'] ? { disable_cache: true } : {}

      rules[idx] = {
        type: 'logical',
        mode: 'and',
        rules: [
          {
            domain_suffix: profile.dnsConfig['fake-ip-filter'],
            invert: true
          },
          {
            query_type: ['A', 'AAAA']
          }
        ],
        ...invert,
        ...disable_cache,
        server: 'fakeip-dns'
      }
    }
  }

  return rules
}

const generateDnsRules = async (profile: ProfileType) => {
  return profile.dnsRulesConfig
    .filter((v) => v.type !== 'final' && v.type !== 'fakeip' && v.server !== 'fakeip-dns')
    .map((rule) => generateDnsRule(rule))
    .filter((v) => v != null)
}

const generateDnsConfig = async (profile: ProfileType) => {
  const remote_dns = profile.dnsConfig['remote-dns']
  const remote_resolver_dns = profile.dnsConfig['remote-resolver-dns']
  const local_dns = profile.dnsConfig['local-dns']
  const resolver_dns = profile.dnsConfig['resolver-dns']
  const remote_detour = profile.dnsConfig['remote-dns-detour']
  const remote_detour_config = remote_detour ? { detour: remote_detour } : {}

  return {
    servers: [
      {
        tag: 'remote-dns',
        address: remote_dns,
        address_resolver: 'remote-resolver-dns',
        ...remote_detour_config
      },
      {
        tag: 'local-dns',
        address: local_dns,
        address_resolver: 'resolver-dns',
        detour: 'direct'
      },
      {
        tag: 'resolver-dns',
        address: resolver_dns,
        detour: 'direct'
      },
      {
        tag: 'remote-resolver-dns',
        address: remote_resolver_dns,
        ...remote_detour_config
      },
      ...(profile.dnsConfig.fakeip
        ? [
            {
              tag: 'fakeip-dns',
              address: 'fakeip'
            }
          ]
        : []),
      {
        tag: 'block',
        address: 'rcode://success'
      }
    ],
    rules: await (profile.dnsConfig.fakeip
      ? generateDnsRulesWithFakeIp(profile)
      : generateDnsRules(profile))
  }
}

const generateInBoundsConfig = async (profile: ProfileType) => {
  const inbounds = []

  let http_proxy_port = 0

  const listenConfig = {
    sniff: profile.advancedConfig.sniff,
    sniff_override_destination: profile.advancedConfig['sniff-override-destination'],
    ...(profile.advancedConfig.domain_strategy && profile.advancedConfig.domain_strategy.length > 0
      ? { domain_strategy: profile.advancedConfig.domain_strategy }
      : {})
  }

  const listen = profile.generalConfig['allow-lan'] ? '::' : '127.0.0.1'

  if (profile.generalConfig['mixed-port'] > 0) {
    http_proxy_port = profile.generalConfig['mixed-port']

    inbounds.push({
      type: 'mixed',
      listen: listen,
      listen_port: profile.generalConfig['mixed-port'],
      ...listenConfig,
      tcp_fast_open: profile.advancedConfig['tcp-fast-open'],
      tcp_multi_path: profile.advancedConfig['tcp-multi-path'],
      udp_fragment: profile.advancedConfig['udp-fragment']
    })
  }

  if (profile.advancedConfig.port > 0) {
    if (http_proxy_port == 0) {
      http_proxy_port = profile.advancedConfig.port
    }

    inbounds.push({
      type: 'http',
      listen: listen,
      listen_port: profile.advancedConfig.port,
      ...listenConfig,
      tcp_fast_open: profile.advancedConfig['tcp-fast-open'],
      tcp_multi_path: profile.advancedConfig['tcp-multi-path'],
      udp_fragment: profile.advancedConfig['udp-fragment']
    })
  }

  if (profile.advancedConfig['socks-port'] > 0) {
    inbounds.push({
      type: 'socks',
      listen: listen,
      listen_port: profile.advancedConfig['socks-port'],
      ...listenConfig,
      tcp_fast_open: profile.advancedConfig['tcp-fast-open'],
      tcp_multi_path: profile.advancedConfig['tcp-multi-path'],
      udp_fragment: profile.advancedConfig['udp-fragment']
    })
  }

  if (profile.tunConfig.enable) {
    let inet4_address = profile.tunConfig['inet4-address']
    let inet6_address = profile.tunConfig['inet6-address']

    if (profile.advancedConfig.domain_strategy === 'ipv4_only') {
      inet6_address = ''
    } else if (profile.advancedConfig.domain_strategy === 'ipv6_only') {
      inet4_address = ''
    }
    if (inet4_address === undefined) {
      inet4_address = TunConfigDefaults['inet4-address']
    }
    if (inet6_address === undefined) {
      inet6_address = TunConfigDefaults['inet6-address']
    }

    inbounds.push({
      type: 'tun',
      interface_name: profile.tunConfig.interface_name,
      ...(inet4_address.length > 0 ? { inet4_address: inet4_address } : {}),
      ...(inet6_address.length > 0 ? { inet6_address: inet6_address } : {}),
      mtu: profile.tunConfig.mtu,
      auto_route: profile.tunConfig['auto-route'],
      strict_route: profile.tunConfig['strict-route'],
      endpoint_independent_nat: profile.tunConfig['endpoint-independent-nat'],
      stack: profile.tunConfig.stack.toLowerCase(),
      platform: {
        http_proxy: {
          enabled: http_proxy_port > 0,
          server: '127.0.0.1',
          server_port: http_proxy_port
        }
      },
      ...listenConfig
    })
  }
  return inbounds
}

const filterProxy = (proxy: { type: string; tag: string }, filter: string) => {
  if (!filter || filter.length == 0 || proxy.type === 'built-in') {
    return true
  }
  return new RegExp(filter).test(proxy.tag)
}

const generateOutBoundsConfig = async (groups: ProfileType['proxyGroupsConfig']) => {
  const outbounds = []

  const subs = new Set<string>()

  groups.forEach((group) => {
    group.use.forEach((use) => subs.add(use))
  })
  const proxyMap: Record<string, ProxiesType[]> = {}
  const proxyTags = new Set<string>()
  const proxies: any = []

  const subscribesStore = useSubscribesStore()
  for (const subID of subs) {
    const sub = subscribesStore.getSubscribeById(subID)
    if (sub) {
      try {
        const subStr = await Readfile(sub.path)
        const subProxies = JSON.parse(subStr)

        // let subProxies = JSON.parse(subStr)
        // subProxies = sub.proxies
        //   .map((proxy) => {
        //     return subProxies.find((v: any) => v.tag === proxy.tag)
        //   })
        //   .filter((v) => v !== undefined)

        proxyMap[sub.id] = subProxies
        for (const subProxy of subProxies) {
          proxyTags.add(subProxy.tag)
          proxies.push(subProxy)
        }
      } catch (error) {
        console.log(error)
      }
    }
  }

  for (const group of groups) {
    for (const proxy of group.proxies)
      if (proxy.type !== 'built-in' && filterProxy(proxy, group.filter)) {
        if (!proxyTags.has(proxy.tag)) {
          if (!proxyMap[proxy.type]) {
            const sub = subscribesStore.getSubscribeById(proxy.type)
            if (sub) {
              try {
                const subStr = await Readfile(sub.path)
                const subProxies = JSON.parse(subStr)
                proxyMap[sub.id] = subProxies
              } catch (error) {
                console.log(error)
              }
            }
          }
          if (proxyMap[proxy.type]) {
            const subProxy = proxyMap[proxy.type].find((v) => v.tag === proxy.tag)
            if (subProxy) {
              proxyTags.add(proxy.tag)
              proxies.push(subProxy)
            }
          }
        }
      }
  }

  const usedProxies = new Set<string>()

  function getGroupOutbounds(group_proxies: any[], uses: string[], filter: string) {
    const outbounds = group_proxies
      .filter((proxy) => filterProxy(proxy, filter))
      .map((proxy) => {
        usedProxies.add(proxy.tag)
        return proxy.tag
      })
    outbounds.push(
      ...uses
        .map((use) =>
          proxyMap[use]
            .filter((proxy) => filterProxy(proxy, filter))
            .map((proxy) => {
              usedProxies.add(proxy.tag)
              return proxy.tag
            })
        )
        .flat()
    )
    return outbounds
  }

  groups.forEach((group) => {
    group.type === ProxyGroup.Select &&
      outbounds.push({
        tag: group.tag,
        type: 'selector',
        outbounds: getGroupOutbounds(group.proxies, group.use, group.filter)
      })
    group.type === ProxyGroup.UrlTest &&
      outbounds.push({
        tag: group.tag,
        type: 'urltest',
        outbounds: getGroupOutbounds(group.proxies, group.use, group.filter),
        url: group.url,
        interval: group.interval.toString() + 's',
        tolerance: group.tolerance
      })
  })
  outbounds.push(...proxies.filter((v: any) => usedProxies.has(v.tag)))
  return outbounds
}

const generateRouteConfig = async (profile: ProfileType) => {
  const route: Record<string, any> = {
    rule_set: await generateRuleSets(profile.rulesConfig, profile.dnsRulesConfig),
    rules: []
  }

  if (profile.generalConfig.mode == 'rule') {
    route.rules.push(
      ...profile.rulesConfig
        .filter((v) => v.type !== 'final')
        .map((rule) => generateRule(rule))
        .filter((v) => v != null)
    )
    const final = profile.rulesConfig.filter((v) => v.type === 'final')
    if (final.length > 0) {
      route['final'] = final[0].proxy
    }
  }

  const final = profile.rulesConfig.filter((v) => v.type === 'final')
  if (final.length > 0) {
    route['final'] = final[0].proxy
  } else if (profile.generalConfig.mode == 'direct') {
    route['final'] = 'direct'
  }

  const interface_name = profile.generalConfig['interface-name']
  if (interface_name == 'Auto') {
    route['auto_detect_interface'] = true
  } else {
    route['default_interface'] = interface_name
  }
  return route
}

export const generateConfig = async (originalProfile: ProfileType) => {
 const profile = deepClone(originalProfile)

  const config: Record<string, any> = {
    log: { level: profile.generalConfig['log-level'], timestamp: true },
    experimental: {
      clash_api: {
        external_controller: profile.advancedConfig['external-controller'],
        external_ui: profile.advancedConfig['external-ui'],
        secret: profile.advancedConfig.secret,
        external_ui_download_url: profile.advancedConfig['external-ui-url'],
        default_mode: profile.generalConfig.mode
      },
      cache_file: {
        enabled: profile.advancedConfig.profile['store-cache'],
        store_fakeip: profile.advancedConfig.profile['store-fake-ip']
      }
    },
    inbounds: await generateInBoundsConfig(profile),
    outbounds: [
      ...(await generateOutBoundsConfig(profile.proxyGroupsConfig)),
      {
        type: 'direct',
        tag: 'direct'
      },
      {
        type: 'dns',
        tag: 'dns-out'
      },
      {
        type: 'block',
        tag: 'block'
      }
    ],
    route: await generateRouteConfig(profile)
  }

  if (profile.dnsConfig.enable) {
    const inet4_range = profile.dnsConfig['fake-ip-range-v4']
    const inet6_range = profile.dnsConfig['fake-ip-range-v6']
    config['dns'] = {
      ...(await generateDnsConfig(profile)),
      fakeip: {
        enabled: profile.dnsConfig.fakeip,
        ...(inet4_range.length > 0 ? { inet4_range: inet4_range } : {}),
        ...(inet6_range.length > 0 ? { inet6_range: inet6_range } : {})
      },
      final: profile.dnsConfig['final-dns'],
      ...(profile.dnsConfig.strategy.length > 0 ? { strategy: profile.dnsConfig.strategy } : {})
    }
  }

  const pluginsStore = usePluginsStore()
  return await pluginsStore.onGenerateTrigger(config, originalProfile)
}

export const generateConfigFile = async (profile: ProfileType) => {
  // const header = `# DO NOT EDIT - Generated by ${APP_TITLE}\n`

  const config = await generateConfig(profile)

  await Writefile(KernelConfigFilePath, JSON.stringify(config, null, 2))
}

export const addToRuleSet = async (ruleset: 'direct' | 'reject' | 'block', payload: string) => {
  // TODO: sing-box json rule
  const path = `data/rulesets/${ruleset}.json`
  const content = (await ignoredError(Readfile, path)) || '{}'
  const { payload: p = [] } = JSON.parse(content)
  p.unshift(payload)
  await Writefile(path, JSON.stringify({ payload: [...new Set(p)] }))
}
