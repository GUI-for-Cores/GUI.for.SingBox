import { parse } from 'yaml'

import { ReadFile, WriteFile } from '@/bridge'
import { CoreConfigFilePath } from '@/constant/kernel'
import { Branch } from '@/enums/app'
import {
  DnsServer,
  Inbound,
  Outbound,
  RuleAction,
  RulesetType,
  RuleType,
  Strategy,
} from '@/enums/kernel'
import { useAppSettingsStore, usePluginsStore, useRulesetsStore, useSubscribesStore } from '@/stores'
import { deepAssign, deepClone, APP_TITLE, createTextMatcher } from '@/utils'

const _generateRule = (rule: App.Rule | App.DnsRule, rule_set: App.ProfileRuleSet[], inbounds: App.Inbound[]) => {
  const getInbound = (id: string) => inbounds.find((v) => v.id === id)?.tag
  const getRuleset = (id: string) => rule_set.find((v) => v.id === id)?.tag

  const extra: Recordable = { action: rule.action, invert: rule.invert ? true : undefined }
  if (rule.type === RuleType.Inline) {
    deepAssign(extra, JSON.parse(rule.payload))
  } else if (rule.type === RuleType.RuleSet) {
    extra[rule.type] = rule.payload.split(',').map((id) => getRuleset(id))
  } else if (rule.type === RuleType.Inbound) {
    extra[rule.type] = getInbound(rule.payload)
  } else if ([RuleType.IpIsPrivate, RuleType.IpAcceptAny].includes(rule.type as any)) {
    extra[rule.type] = rule.payload === 'true'
  } else if (rule.type === RuleType.ClashMode) {
    extra[rule.type] = rule.payload
  } else {
    extra[rule.type] = String(rule.payload)
      .split(',')
      .map((val) => {
        if ([RuleType.Port, RuleType.SourcePort].includes(rule.type as any)) {
          return Number(val)
        }
        return val
      })
    if (extra[rule.type].length === 1) {
      extra[rule.type] = extra[rule.type][0]
    }
  }
  return extra
}

const generateExperimental = (experimental: App.Experimental, outbounds: App.Outbound[]) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  return {
    clash_api: {
      ...experimental.clash_api,
      external_ui_download_detour: getOutbound(experimental.clash_api.external_ui_download_detour),
    },
    cache_file: {
      ...experimental.cache_file,
      store_rdrc: undefined,
    },
  }
}

const generateInbounds = (inbounds: App.Inbound[]) => {
  return inbounds.flatMap((inbound) => {
    if (!inbound.enable) return []
    if (inbound.type !== Inbound.Tun) {
      const users = inbound[inbound.type]!.users.map((user) => ({
        username: user.split(':')[0],
        password: user.split(':')[1],
      }))
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound[inbound.type]!.listen,
        users: users.length > 0 ? users : undefined,
      }
    }
    if (inbound.type === Inbound.Tun) {
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound.tun!,
        route_address: inbound.tun!.route_address?.length ? inbound.tun!.route_address : undefined,
        route_exclude_address: inbound.tun!.route_exclude_address?.length
          ? inbound.tun!.route_exclude_address
          : undefined,
      }
    }
  })
}

const generateOutbounds = async (outbounds: App.Outbound[]) => {
  const result: Recordable[] = []
  const SubscriptionCache: Recordable<any[]> = {}
  const SubscriptionDnsServersCache: Recordable<Recordable[]> = {}
  const proxiesSet = new Set<any>()
  const builtInProxiesSet = new Set<string>()
  const dnsServersMap = new Map<string, Recordable>()

  const subscribesStore = useSubscribesStore()
  const collectSubscriptionDnsServers = (subId: string) => {
    SubscriptionDnsServersCache[subId]?.forEach((server) => {
      if (server.tag && !dnsServersMap.has(server.tag)) {
        dnsServersMap.set(server.tag, server)
      }
    })
  }

  for (const outbound of outbounds) {
    const _outbound: Recordable = {
      type: outbound.type,
      tag: outbound.tag,
    }
    if (outbound.type === Outbound.Urltest) {
      _outbound.url = outbound.url
      _outbound.interval = outbound.interval
      _outbound.tolerance = outbound.tolerance
    }
    if (outbound.type === Outbound.Selector || outbound.type === Outbound.Urltest) {
      _outbound.interrupt_exist_connections = outbound.interrupt_exist_connections
      _outbound.outbounds = []
      const isTagMatching = createTextMatcher(outbound.include, outbound.exclude)
      for (const proxy of outbound.outbounds) {
        if (proxy.type === 'Built-in') {
          if ([Outbound.Direct, Outbound.Block].includes(proxy.id as Outbound)) {
            builtInProxiesSet.add(proxy.id)
          }
          _outbound.outbounds.push(proxy.tag)
        } else {
          const subId = proxy.type === 'Subscription' ? proxy.id : proxy.type
          if (!SubscriptionCache[subId]) {
            const sub = subscribesStore.getSubscribeById(subId)
            if (sub) {
              const subStr = await ReadFile(sub.path)
              const proxies = JSON.parse(subStr)
              SubscriptionCache[subId] = proxies
              SubscriptionDnsServersCache[subId] = sub.dnsServers || []
            }
          }
          if (proxy.type === 'Subscription') {
            _outbound.outbounds.push(
              ...SubscriptionCache[subId]!.map((v) => v.tag).filter((tag) => isTagMatching(tag)),
            )
            SubscriptionCache[subId]!.forEach((v) => proxiesSet.add(v))
            collectSubscriptionDnsServers(subId)
          } else {
            const _proxy = SubscriptionCache[subId]!.find((v) => v.tag === proxy.tag)
            if (_proxy && isTagMatching(_proxy.tag)) {
              _outbound.outbounds.push(_proxy.tag)
              proxiesSet.add(_proxy)
              collectSubscriptionDnsServers(subId)
            }
          }
        }
      }
    }
    result.push(_outbound)
  }

  result.push(...proxiesSet)
  result.push(...Array.from(builtInProxiesSet).map((v) => ({ type: v, tag: v })))

  return {
    outbounds: result,
    dnsServers: Array.from(dnsServersMap.values()),
  }
}

const normalizeSubscriptionDnsServers = (
  dnsServers: Recordable[],
  generatedOutbounds: Recordable[],
) => {
  const outboundTags = new Set(generatedOutbounds.map((outbound) => outbound.tag))
  return dnsServers.map((server) => {
    const normalized = { ...server }
    if (normalized.detour && !outboundTags.has(normalized.detour)) {
      delete normalized.detour
    }
    return normalized
  })
}

const generateRoute = (route: App.Route, inbounds: App.Inbound[], outbounds: App.Outbound[], dns: App.Dns) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const isInboundEnabled = (id: string) => inbounds.find((v) => v.id === id)?.enable

  const rulesetsStore = useRulesetsStore()

  const extra: Recordable = {}
  if (!route.auto_detect_interface) {
    extra.default_interface = route.default_interface
  }
  return {
    rules: route.rules.flatMap((rule) => {
      if (rule.type === RuleType.InsertionPoint || !rule.enable) {
        return []
      }
      if (rule.type === RuleType.Inbound && !isInboundEnabled(rule.payload)) {
        return []
      }
      const extra: Recordable = _generateRule(rule, route.rule_set, inbounds)

      if (rule.action === RuleAction.Route) {
        extra.outbound = getOutbound(rule.outbound)
      } else if (rule.action === RuleAction.RouteOptions) {
        deepAssign(extra, JSON.parse(rule.outbound))
      } else if (rule.action === RuleAction.Reject) {
        extra.method = rule.outbound
      } else if (rule.action === RuleAction.Sniff) {
        if (rule.sniffer.length) {
          extra.sniffer = rule.sniffer
        }
      } else if (rule.action === RuleAction.Resolve) {
        if (rule.strategy !== Strategy.Default) {
          extra.strategy = rule.strategy
        }
        extra.server = getDnsServer(rule.server)
      }
      if (rule.invert) {
        extra.invert = true
      }
      return extra
    }),
    rule_set: route.rule_set.map((ruleset) => {
      const extra: Recordable = {}
      if (ruleset.type === RuleType.Inline) {
        extra.rules = JSON.parse(ruleset.rules)
      } else if (ruleset.type === RulesetType.Local) {
        const _ruleset = rulesetsStore.getRulesetById(ruleset.path)
        extra.path = _ruleset?.path.replace('data/', '../')
        extra.format = ruleset.format
      } else if (ruleset.type === RulesetType.Remote) {
        extra.url = ruleset.url
        extra.format = ruleset.format
        extra.download_detour = getOutbound(ruleset.download_detour)
        if (ruleset.update_interval) {
          extra.update_interval = ruleset.update_interval
        }
      }
      return {
        tag: ruleset.tag,
        type: ruleset.type,
        ...extra,
      }
    }),
    auto_detect_interface: route.auto_detect_interface,
    find_process: route.find_process ? true : undefined,
    final: getOutbound(route.final),
    default_domain_resolver: {
      server: getDnsServer(route.default_domain_resolver.server),
    },
    ...extra,
  }
}

const generateDns = (
  dns: App.Dns,
  rule_set: App.ProfileRuleSet[],
  inbounds: App.Inbound[],
  outbounds: App.Outbound[],
  subscriptionDnsServers: Recordable[] = [],
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const extra: Recordable = {}
  if (dns.strategy !== Strategy.Default) {
    extra.strategy = dns.strategy
  }
  if (dns.client_subnet) {
    extra.client_subnet = dns.client_subnet
  }
  const servers: Recordable[] = dns.servers.flatMap((server) => {
    const extra: Recordable = {}
    if (
      [
        DnsServer.Local,
        DnsServer.Tcp,
        DnsServer.Udp,
        DnsServer.Tls,
        DnsServer.Quic,
        DnsServer.Https,
        DnsServer.H3,
        DnsServer.Dhcp,
      ].includes(server.type as any)
    ) {
      if (server.detour) {
        const outbound = getOutbound(server.detour)
        if (outbound?.type !== Outbound.Direct) {
          extra.detour = outbound?.tag
        }
      }
      server.domain_resolver && (extra.domain_resolver = getDnsServer(server.domain_resolver))
      if (
        [
          DnsServer.Tcp,
          DnsServer.Udp,
          DnsServer.Tls,
          DnsServer.Quic,
          DnsServer.Https,
          DnsServer.H3,
        ].includes(server.type as any)
      ) {
        server.server_port && (extra.server_port = Number(server.server_port))
        extra.server = server.server
        if ([DnsServer.Https, DnsServer.H3].includes(server.type as any)) {
          server.path && (extra.path = server.path)
        }
      }
    }
    if (server.type === DnsServer.Hosts) {
      extra.path = server.hosts_path.reduce((p, c) => p.concat(c.split(',')), [] as string[])
      extra.predefined = Object.entries(server.predefined).reduce(
        (p, [k, v]) => ({ ...p, [k]: v.split(',') }),
        {},
      )
    } else if (server.type === DnsServer.Dhcp) {
      server.interface && (extra.interface = server.interface)
    } else if (server.type === DnsServer.FakeIP) {
      server.inet4_range && (extra.inet4_range = server.inet4_range)
      server.inet6_range && (extra.inet6_range = server.inet6_range)
    }
    return {
      tag: server.tag,
      type: server.type,
      ...extra,
    }
  })
  const serverTags = new Set(servers.map((server) => server.tag))
  subscriptionDnsServers.forEach((server) => {
    if (server.tag && !serverTags.has(server.tag)) {
      servers.push(server)
      serverTags.add(server.tag)
    }
  })

  return {
    servers,
    rules: dns.rules.flatMap((rule) => {
      if (rule.type === RuleType.InsertionPoint || !rule.enable) {
        return []
      }
      const extra: Recordable = _generateRule(rule, rule_set, inbounds)
      if (rule.type === RuleType.Inline && rule.payload.includes('__is_fake_ip')) {
        if (!dns.servers.find((v) => v.type === DnsServer.FakeIP)) {
          return []
        }
        delete extra.__is_fake_ip
      }
      if ([RuleAction.Route, RuleAction.RouteOptions].includes(rule.action as any)) {
        rule.disable_cache && (extra.disable_cache = rule.disable_cache)
        rule.client_subnet && (extra.client_subnet = rule.client_subnet)
        if (rule.action === RuleAction.Route) {
          extra.server = getDnsServer(rule.server)
          if (rule.strategy !== Strategy.Default) {
            // extra.strategy = rule.strategy
          }
        }
      }
      if ([RuleAction.RouteOptions, RuleAction.Predefined].includes(rule.action as any)) {
        deepAssign(extra, JSON.parse(rule.server))
      }
      if (rule.action === RuleAction.Reject) {
        extra.method = rule.server
      }
      return extra
    }),
    disable_cache: dns.disable_cache,
    disable_expire: dns.disable_expire,
    independent_cache: dns.independent_cache,
    final: getDnsServer(dns.final),
    ...extra,
  }
}

export const generateDnsServerURL = (dnsServer: App.DnsServerConfig) => {
  const { type, server_port, path, server, interface: _interface } = dnsServer
  let address = ''
  if (type == DnsServer.Https) {
    address = `https://${server}${server_port ? ':' + server_port : ''}${path ? path : ''}`
  } else if (type == DnsServer.H3) {
    address = `h3://${server}${server_port ? ':' + server_port : ''}${path ? path : ''}`
  } else if (type == DnsServer.Dhcp) {
    address = `dhcp://${_interface}`
  } else if (type == DnsServer.FakeIP) {
    address =
      'fake-ip://' +
      (dnsServer.inet4_range ? dnsServer.inet4_range : '') +
      (dnsServer.inet6_range ? (dnsServer.inet4_range ? ',' : '') + dnsServer.inet6_range : '')
  } else if (type === DnsServer.Hosts) {
    address = 'hosts'
  } else if (type === DnsServer.Local) {
    address = 'local'
  } else {
    address = `${type}://${server}${server_port ? ':' + server_port : ''}`
  }
  return address
}

const _adaptToStableBranch = (_: Recordable) => {}

type GenerateConfigOptions = {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export const generateConfig = async (
  originalProfile: App.Profile,
  options: GenerateConfigOptions = {},
) => {
  if (typeof options === 'boolean') {
    options = { enableStableConfigCompat: options }
  }
  const appSettings = useAppSettingsStore()
  const isMainBranch = appSettings.app.kernel.branch === Branch.Main

  const {
    enableStableConfigCompat = isMainBranch,
    enablePluginProcessing = true,
    enableMixinProcessing = true,
    enableScriptProcessing = true,
  } = options

  const profile = deepClone(originalProfile)
  const generatedOutbounds = await generateOutbounds(profile.outbounds)
  const subscriptionDnsServers = normalizeSubscriptionDnsServers(
    generatedOutbounds.dnsServers,
    generatedOutbounds.outbounds,
  )
  // step 1
  let config: Recordable = {
    log: profile.log,
    experimental: generateExperimental(profile.experimental, profile.outbounds),
    inbounds: generateInbounds(profile.inbounds),
    outbounds: generatedOutbounds.outbounds,
    route: generateRoute(profile.route, profile.inbounds, profile.outbounds, profile.dns),
    dns: generateDns(
      profile.dns,
      profile.route.rule_set,
      profile.inbounds,
      profile.outbounds,
      subscriptionDnsServers,
    ),
  }

  // adapt to stable branch
  if (enableStableConfigCompat) {
    _adaptToStableBranch(config)
  }

  // step 2
  if (enablePluginProcessing) {
    const pluginsStore = usePluginsStore()
    config = await pluginsStore.onGenerateTrigger(config, originalProfile)
  }

  // step 3
  if (enableMixinProcessing) {
    const { priority, config: mixin } = originalProfile.mixin
    if (priority === 'mixin') {
      deepAssign(config, parse(mixin))
    } else if (priority === 'gui') {
      deepAssign(config, deepAssign(parse(mixin), config))
    }
  }

  // step 4
  if (enableScriptProcessing) {
    const fn = new window.AsyncFunction(
      'config',
      `${originalProfile.script.code}; return await onGenerate(config)`,
    )
    try {
      config = await fn(config)
    } catch (error: any) {
      throw error.message || error
    }

    if (typeof config !== 'object') {
      throw 'Wrong result'
    }
  }

  return config
}

export const generateConfigFile = async (
  profile: App.Profile,
  beforeWrite: (config: any) => Promise<any>,
) => {
  const header = `DO NOT EDIT - Generated by ${APP_TITLE}`

  const _config = await generateConfig(profile)
  const config = await beforeWrite(_config)

  config.experimental.cache_file.path = 'cache.db'

  await WriteFile(CoreConfigFilePath, JSON.stringify({ $schema: header, ...config }, null, 2))
}
