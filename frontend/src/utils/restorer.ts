import * as Defaults from '@/constant/profile'
import {
  Inbound,
  Outbound,
  RuleAction,
  RulesetType,
  RuleType as RouteRuleType,
  DnsServer,
} from '@/enums/kernel'

import { createTextMatcher, deepAssign, sampleID } from './others'
import { useProfilesStore, useRulesetsStore, useSubscribesStore } from '@/stores'
import type { Subscription } from '@/types/app'

const supportedRuleTypes = [
  RouteRuleType.Inbound,
  RouteRuleType.Network,
  RouteRuleType.Protocol,
  RouteRuleType.Domain,
  RouteRuleType.DomainSuffix,
  RouteRuleType.DomainKeyword,
  RouteRuleType.DomainRegex,
  RouteRuleType.SourceIPCidr,
  RouteRuleType.IPCidr,
  RouteRuleType.SourcePort,
  RouteRuleType.SourcePortRange,
  RouteRuleType.Port,
  RouteRuleType.PortRange,
  RouteRuleType.ProcessName,
  RouteRuleType.ProcessPath,
  RouteRuleType.ProcessPathRegex,
  RouteRuleType.RuleSet,
  RouteRuleType.IpIsPrivate,
  RouteRuleType.IpAcceptAny,
  RouteRuleType.ClashMode,
]

const buildTagIdMapping = (prefix: string, arr?: Recordable[]): Recordable<string> => {
  if (!arr) return {}
  return arr.reduce((p, c, i) => ((p[c.tag] = prefix + i), p), {})
}

type RestoreProfileOptions = {
  profile?: IProfile
  subscriptionIds?: string[]
}

export const restoreProfile = (
  config: Recordable,
  name = sampleID(),
  options: RestoreProfileOptions = {},
): IProfile => {
  const template = useProfilesStore().getProfileTemplate()

  const { profile, subscriptionIds } = options

  const InboundsIds = buildTagIdMapping('in-', config.inbounds)
  const OutboundsIds = buildTagIdMapping('out-', config.outbounds)
  const RouteRuleSetIds = buildTagIdMapping('ruleset-', config.route?.rule_set)
  const DnsServersIds = buildTagIdMapping('dns-', config.dns?.servers)

  return {
    id: profile?.id || sampleID(),
    name,
    log: deepAssign(Defaults.DefaultLog(), config.log),
    experimental: restoreExperimental(config.experimental, OutboundsIds),
    inbounds: restoreInbounds(config.inbounds || [], InboundsIds),
    outbounds: restoreOutbounds(
      config.outbounds || [],
      OutboundsIds,
      profile?.outbounds || [],
      subscriptionIds || [],
    ),
    route: {
      rule_set: restoreRouteRuleset(config.route?.rule_set || [], RouteRuleSetIds, OutboundsIds),
      rules: restoreRouteRules(
        config.route?.rules || [],
        InboundsIds,
        OutboundsIds,
        RouteRuleSetIds,
        DnsServersIds,
      ),
      auto_detect_interface:
        config.route?.auto_detect_interface ?? template.route.auto_detect_interface,
      find_process: config.route?.find_process ?? template.route.find_process,
      default_interface: config.route?.default_interface ?? template.route.default_interface,
      final: OutboundsIds[config.route?.final] ?? template.route.final,
      default_domain_resolver: {
        server:
          DnsServersIds[config.route?.default_domain_resolver?.server] ??
          template.route.default_domain_resolver.server,
        client_subnet:
          config.route?.default_domain_resolver?.client_subnet ??
          template.route.default_domain_resolver.client_subnet,
      },
    },
    dns: {
      disable_cache: config.dns?.disable_cache ?? template.dns.disable_cache,
      disable_expire: config.dns?.disable_expire ?? template.dns.disable_expire,
      independent_cache: config.dns?.independent_cache ?? template.dns.independent_cache,
      final: DnsServersIds[config.dns?.final] ?? template.dns.final,
      strategy: config.dns?.strategy ?? template.dns.strategy,
      client_subnet: config.dns?.client_subnet ?? template.dns.client_subnet,
      servers: restoreDnsServers(config.dns?.servers || [], DnsServersIds, OutboundsIds),
      rules: restoreDnsRules(config.dns?.rules || [], InboundsIds, RouteRuleSetIds, DnsServersIds),
    },
    mixin: profile?.mixin || Defaults.DefaultMixin(),
    script: profile?.script || Defaults.DefaultScript(),
  }
}

const restoreExperimental = (raw: Recordable, OutboundsIds: Recordable): IExperimental => {
  const template = Defaults.DefaultExperimental()
  const experimental = deepAssign(template, raw)
  experimental.clash_api.external_ui_download_detour =
    OutboundsIds[raw.clash_api?.external_ui_download_detour] || ''
  return experimental
}

const restoreInbounds = (inbounds: Recordable[], InboundsIds: Recordable): IInbound[] => {
  return inbounds.flatMap((raw) => {
    if (![Inbound.Mixed, Inbound.Http, Inbound.Socks, Inbound.Tun].includes(raw.type)) return []
    const inbound: IInbound = {
      id: InboundsIds[raw.tag],
      tag: raw.tag,
      type: raw.type,
      enable: true,
    }
    if (raw.type === Inbound.Tun) {
      const template = Defaults.DefaultInboundTun()
      inbound.tun = {
        interface_name: raw.interface_name ?? template.interface_name,
        address: raw.address ?? template.address,
        mtu: raw.mtu ?? template.mtu,
        auto_route: raw.auto_route ?? template.auto_route,
        strict_route: raw.strict_route ?? template.strict_route,
        route_address: raw.route_address ?? template.route_address,
        route_exclude_address: raw.route_exclude_address ?? template.route_exclude_address,
        endpoint_independent_nat: raw.endpoint_independent_nat ?? template.endpoint_independent_nat,
        stack: raw.stack ?? template.stack,
      }
    }
    if ([Inbound.Mixed, Inbound.Http, Inbound.Socks].includes(raw.type)) {
      const template = Defaults.DefaultInboundMixed()
      inbound[raw.type as Exclude<Inbound, Inbound.Tun>] = {
        listen: {
          listen: raw.listen ?? template.listen.listen,
          listen_port: raw.listen_port ?? template.listen.listen_port,
          tcp_fast_open: raw.tcp_fast_open ?? template.listen.tcp_fast_open,
          tcp_multi_path: raw.tcp_multi_path ?? template.listen.tcp_multi_path,
          udp_fragment: raw.udp_fragment ?? template.listen.udp_fragment,
        },
        users: raw.users?.map((user: any) => user.username + ':' + user.password) ?? template.users,
      }
    }
    return inbound
  })
}

const restoreOutbounds = (
  outbounds: Recordable[],
  OutboundsIds: Recordable,
  originalOutbounds: IOutbound[],
  subscriptionIds: string[],
): IOutbound[] => {
  const subscribesStore = useSubscribesStore()

  const subscriptionCache = new Map<string, Subscription>()
  const proxyToSubMap = new Map<string, { sub: string; id: string }>()
  const originalOutboundMap = new Map<string, IOutbound>()

  const groupTags = new Set(
    outbounds
      .filter((o: Recordable) => [Outbound.Selector, Outbound.Urltest].includes(o.type))
      .map((o: Recordable) => o.tag),
  )

  subscriptionIds.forEach((id) => {
    const sub = subscribesStore.getSubscribeById(id)
    if (sub) {
      subscriptionCache.set(id, sub)
      sub.proxies.forEach((proxy) => {
        proxyToSubMap.set(proxy.tag, { sub: id, id: proxy.id })
      })
    }
  })

  originalOutbounds.forEach((outbound) => {
    originalOutboundMap.set(outbound.tag, outbound)
  })

  return outbounds.flatMap((raw) => {
    if (![Outbound.Selector, Outbound.Urltest].includes(raw.type)) {
      return []
    }
    const outbound = Defaults.DefaultOutbound()
    outbound.id = OutboundsIds[raw.tag]
    outbound.tag = raw.tag
    outbound.type = raw.type

    let newOutbounds: IProxy[] = []

    raw.outbounds?.forEach((tag: string) => {
      const isBuiltIn = [Outbound.Direct, Outbound.Block].includes(tag as Outbound)
      if (isBuiltIn) {
        newOutbounds.push({ id: tag, type: 'Built-in', tag })
      } else if (groupTags.has(tag)) {
        const id = OutboundsIds[tag]
        if (id) {
          newOutbounds.push({ id, type: 'Built-in', tag })
        }
      } else {
        const proxy = proxyToSubMap.get(tag)
        if (proxy) {
          newOutbounds.push({ id: proxy.id, type: proxy.sub, tag })
        }
      }
    })

    const originalGroup = originalOutboundMap.get(outbound.tag)
    if (originalGroup) {
      outbound.icon = originalGroup.icon
      outbound.hidden = originalGroup.hidden
      outbound.include = originalGroup.include
      outbound.exclude = originalGroup.exclude

      const currentNonBuiltInIds = new Set(
        newOutbounds.filter((v) => v.type !== 'Built-in').map((v) => v.id),
      )

      subscriptionIds.forEach((id) => {
        const sub = subscriptionCache.get(id)
        if (sub) {
          const isTagMatching = createTextMatcher(originalGroup.include, originalGroup.exclude)
          const matchedProxies = sub.proxies.filter((proxy) => isTagMatching(proxy.tag))

          const isAllMatched =
            matchedProxies.length > 0 &&
            matchedProxies.every((proxy) => currentNonBuiltInIds.has(proxy.id))

          if (isAllMatched) {
            const matchedIds = new Set(matchedProxies.map((p) => p.id))
            newOutbounds = newOutbounds.filter(
              (v) => v.type === 'Built-in' || !matchedIds.has(v.id),
            )
            newOutbounds.push({ id: sub.id, type: 'Subscription', tag: sub.name })

            matchedIds.forEach((matchedId) => currentNonBuiltInIds.delete(matchedId))
          }
        }
      })
    }

    outbound.outbounds = newOutbounds

    if ('interrupt_exist_connections' in raw) {
      outbound.interrupt_exist_connections = raw.interrupt_exist_connections
    }
    if (Outbound.Urltest === raw.type) {
      if ('url' in raw) {
        outbound.url = raw.url
      }
      if ('interval' in raw) {
        outbound.interval = raw.interval
      }
      if ('tolerance' in raw) {
        outbound.tolerance = raw.tolerance
      }
    }
    return outbound
  })
}

const restoreRouteRuleset = (
  rulesets: Recordable[],
  RouteRuleSetIds: Recordable,
  OutboundsIds: Recordable,
): IRuleSet[] => {
  const rulesetsStore = useRulesetsStore()
  return rulesets.flatMap((raw) => {
    const ruleset = Defaults.DefaultRouteRuleset()
    ruleset.id = RouteRuleSetIds[raw.tag]
    ruleset.type = raw.type
    ruleset.tag = raw.tag

    if (raw.type === RulesetType.Inline) {
      if ('rules' in raw) {
        ruleset.rules = JSON.stringify(raw.rules, null, 2)
      }
    } else if (raw.type === RulesetType.Local) {
      if ('path' in raw) {
        const r = rulesetsStore.rulesets.find((v) => v.path === raw.path.replace('../', 'data/'))
        if (r) {
          ruleset.path = r.id
        } else {
          ruleset.path = raw.path
        }
      }
      if ('format' in raw) {
        ruleset.format = raw.format
      }
    } else if (raw.type === RulesetType.Remote) {
      if ('format' in raw) {
        ruleset.format = raw.format
      }
      if ('url' in raw) {
        ruleset.url = raw.url
      }
      if ('download_detour' in raw) {
        ruleset.download_detour = OutboundsIds[raw.download_detour]
      }
      if ('update_interval' in raw) {
        ruleset.update_interval = raw.update_interval
      }
    }
    return ruleset
  })
}

const restoreRouteRules = (
  rules: Recordable[],
  InboundsIds: Recordable,
  OutboundsIds: Recordable,
  RouteRuleSetIds: Recordable,
  DnsServersIds: Recordable,
): IRule[] => {
  return rules.flatMap((raw, i) => {
    const rule = Defaults.DefaultRouteRule()

    rule.id = 'rule-' + i
    rule.action = raw.action || RuleAction.Route

    const hits = supportedRuleTypes.filter((key) => key in raw)
    if (hits.length === 1) {
      rule.type = hits[0] as any
    } else {
      rule.type = RouteRuleType.Inline
    }

    if (rule.type === RouteRuleType.Inline) {
      rule.payload = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          outbound: undefined,
          sniffer: undefined,
          strategy: undefined,
          server: undefined,
        },
        null,
        2,
      )
    } else if (rule.type === RouteRuleType.Inbound) {
      rule.payload = InboundsIds[raw[rule.type]]
    } else if (rule.type === RouteRuleType.RuleSet) {
      const rs = Array.isArray(raw[rule.type]) ? raw[rule.type] : [raw[rule.type]]
      rule.payload = rs.map((tag: string) => RouteRuleSetIds[tag]).join(',')
    } else {
      rule.payload = Array.isArray(raw[rule.type])
        ? raw[rule.type].join(',')
        : String(raw[rule.type])
    }

    if (RuleAction.Route === raw.action) {
      rule.outbound = OutboundsIds[raw.outbound]
    } else if (RuleAction.Reject === raw.action) {
      if ('method' in raw) {
        rule.outbound = raw.method
      }
    } else if (RuleAction.RouteOptions === raw.action) {
      rule.outbound = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          ...supportedRuleTypes.reduce((p, c) => ((p[c] = undefined), p), {} as Recordable),
        },
        null,
        2,
      )
    } else if (RuleAction.Sniff === raw.action) {
      if ('sniffer' in raw) {
        rule.sniffer = Array.isArray(raw.sniffer) ? raw.sniffer : [raw.sniffer]
      }
    } else if (RuleAction.Resolve === raw.action) {
      if ('strategy' in raw) {
        rule.strategy = raw.strategy
      }
      if ('server' in raw) {
        rule.server = DnsServersIds[raw.server]
      }
    }
    if ('invert' in raw) {
      rule.invert = raw.invert
    }
    return rule
  })
}

const restoreDnsServers = (
  servers: Recordable[],
  DnsServersIds: Recordable,
  OutboundsIds: Recordable,
): IDNSServer[] => {
  return servers.flatMap((raw) => {
    if (!raw.type) return []
    const server = Defaults.DefaultDnsServer()
    server.id = DnsServersIds[raw.tag]
    server.tag = raw.tag
    server.type = raw.type
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
      ].includes(raw.type)
    ) {
      if ('detour' in raw) {
        server.detour = OutboundsIds[raw.detour]
      }
      if ('domain_resolver' in raw) {
        server.domain_resolver = DnsServersIds[raw.domain_resolver]
      }
      if (
        [
          DnsServer.Tcp,
          DnsServer.Udp,
          DnsServer.Tls,
          DnsServer.Quic,
          DnsServer.Https,
          DnsServer.H3,
        ].includes(raw.type)
      ) {
        if ('server' in raw) {
          server.server = raw.server
        }
        if ('server_port' in raw) {
          server.server_port = raw.server_port
        }
        if ([DnsServer.Https, DnsServer.H3].includes(raw.type)) {
          if ('path' in raw) {
            server.path = raw.path
          }
        }
      }
    } else if (DnsServer.Hosts === server.type) {
      if ('path' in raw) {
        server.hosts_path = raw.path
      }
      if ('predefined' in raw) {
        server.predefined = Object.entries<string[] | string>(raw.predefined).reduce(
          (p, [key, value]) => {
            p[key] = Array.isArray(value) ? value.join(',') : value
            return p
          },
          {} as Recordable,
        )
      }
    } else if (DnsServer.Dhcp === server.type) {
      if ('interface' in raw) {
        server.interface = raw.interface
      }
    } else if (DnsServer.FakeIP === server.type) {
      if ('inet4_range' in raw) {
        server.inet4_range = raw.inet4_range
      }
      if ('inet6_range' in raw) {
        server.inet6_range = raw.inet6_range
      }
    }
    return server
  })
}

const restoreDnsRules = (
  rules: Recordable[],
  InboundsIds: Recordable,
  RouteRuleSetIds: Recordable,
  DnsServersIds: Recordable,
): IDNSRule[] => {
  return rules.flatMap((raw: Recordable, i) => {
    const rule = Defaults.DefaultDnsRule()
    rule.id = 'rule-' + i
    rule.action = raw.action || RuleAction.Route

    const hits = supportedRuleTypes.filter((key) => key in raw)
    if (hits.length === 1) {
      rule.type = hits[0] as any
    } else {
      rule.type = RouteRuleType.Inline
    }

    if (rule.type === RouteRuleType.Inline) {
      rule.payload = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          client_subnet: undefined,
          disable_cache: undefined,
          strategy: undefined,
          server: undefined,
        },
        null,
        2,
      )
    } else if (rule.type === RouteRuleType.Inbound) {
      rule.payload = InboundsIds[raw[rule.type]]
    } else if (rule.type === RouteRuleType.RuleSet) {
      const rs = Array.isArray(raw[rule.type]) ? raw[rule.type] : [raw[rule.type]]
      rule.payload = rs.map((tag: string) => RouteRuleSetIds[tag]).join(',')
    } else {
      rule.payload = Array.isArray(raw[rule.type])
        ? raw[rule.type].join(',')
        : String(raw[rule.type])
    }

    if (RuleAction.Route === raw.action) {
      if ('server' in raw) {
        rule.server = DnsServersIds[raw.server]
      }
      if ('strategy' in raw) {
        rule.strategy = raw.strategy
      }
    } else if (RuleAction.Reject === raw.action) {
      if ('method' in raw) {
        rule.server = raw.method
      }
    } else if ([RuleAction.RouteOptions, RuleAction.Predefined].includes(raw.action)) {
      rule.server = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          disable_cache: undefined,
          client_subnet: undefined,
          strategy: undefined,
          server: undefined,
          ...supportedRuleTypes.reduce((p, c) => ((p[c] = undefined), p), {} as Recordable),
        },
        null,
        2,
      )
    }
    if ([RuleAction.Route, RuleAction.RouteOptions].includes(raw.action)) {
      if ('disable_cache' in raw) {
        rule.disable_cache = raw.disable_cache
      }
      if ('client_subnet' in raw) {
        rule.client_subnet = raw.client_subnet
      }
    }
    if ('invert' in raw) {
      rule.invert = raw.invert
    }
    return rule
  })
}
