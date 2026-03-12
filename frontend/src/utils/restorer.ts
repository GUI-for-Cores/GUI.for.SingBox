import * as Defaults from '@/constant/profile'
import {
  Inbound,
  Outbound,
  RuleAction,
  RulesetType,
  RuleType as RouteRuleType,
  DnsServer,
} from '@/enums/kernel'

import { deepAssign, sampleID } from './others'
import { useProfilesStore } from '@/stores'

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
  RouteRuleType.ClashMode,
]

const buildTagIdMapping = (prefix: string, arr?: Recordable[]): Recordable<string> => {
  if (!arr) return {}
  return arr.reduce((p, c, i) => ((p[c.tag] = prefix + i), p), {})
}

type RestoreProfileOptions = {
  extraOutboundsIds?: Recordable
}

export const restoreProfile = (
  config: Recordable,
  name = sampleID(),
  options: RestoreProfileOptions = {},
) => {
  const template = useProfilesStore().getProfileTemplate()

  const { extraOutboundsIds } = options

  const InboundsIds = buildTagIdMapping('in-', config.inbounds)
  const OutboundsIds = buildTagIdMapping('out-', config.outbounds)
  const RouteRuleSetIds = buildTagIdMapping('ruleset-', config.route?.rule_set)
  const DnsServersIds = buildTagIdMapping('dns-', config.dns?.servers)

  extraOutboundsIds && deepAssign(OutboundsIds, extraOutboundsIds)

  const profile: IProfile = {
    id: sampleID(),
    name,
    log: deepAssign(Defaults.DefaultLog(), config.log),
    experimental: restoreExperimental(config.experimental, OutboundsIds),
    inbounds: restoreInbounds(config.inbounds || [], InboundsIds),
    outbounds: restoreOutbounds(config.outbounds || [], OutboundsIds),
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
    mixin: Defaults.DefaultMixin(),
    script: Defaults.DefaultScript(),
  }

  return profile
}

const restoreExperimental = (raw: Recordable, OutboundsIds: Recordable): IExperimental => {
  const template = Defaults.DefaultExperimental()
  const experimental = deepAssign(template, raw)
  experimental.clash_api.external_ui_download_detour =
    OutboundsIds[template.clash_api.external_ui_download_detour]
  return experimental
}

const restoreInbounds = (inbounds: Recordable[], InboundsIds: Recordable): IInbound[] => {
  return inbounds.flatMap((raw) => {
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

const restoreOutbounds = (outbounds: Recordable[], OutboundsIds: Recordable): IOutbound[] => {
  return outbounds.flatMap((outbound) => {
    if (![Outbound.Selector, Outbound.Urltest].includes(outbound.type)) {
      return []
    }
    const extra = Defaults.DefaultOutbound()
    extra.id = OutboundsIds[outbound.tag]
    extra.tag = outbound.tag
    extra.type = outbound.type
    if ([Outbound.Selector, Outbound.Urltest].includes(outbound.type)) {
      if ('interrupt_exist_connections' in outbound) {
        extra.interrupt_exist_connections = outbound.interrupt_exist_connections
      }
      extra.outbounds = outbound.outbounds?.flatMap((tag: string) => {
        if (!OutboundsIds[tag]) return []
        const isBuiltIn = [Outbound.Direct, Outbound.Block].includes(tag as Outbound)
        return {
          id: isBuiltIn ? tag : OutboundsIds[tag],
          type: 'Built-in',
          tag,
        }
      })
    }
    if (Outbound.Urltest === outbound.type) {
      if ('url' in outbound) {
        extra.url = outbound.url
      }
      if ('interval' in outbound) {
        extra.interval = outbound.interval
      }
      if ('tolerance' in outbound) {
        extra.tolerance = outbound.tolerance
      }
    }
    return extra
  })
}

const restoreRouteRuleset = (
  rulesets: Recordable[],
  RouteRuleSetIds: Recordable,
  OutboundsIds: Recordable,
): IRuleSet[] => {
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
        ruleset.path = raw.path
      }
    } else if (raw.type === RulesetType.Remote) {
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
    rule.action = raw.action

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
      rule.payload = raw[rule.type].map((tag: string) => RouteRuleSetIds[tag]).join(',')
    } else {
      rule.payload = raw[rule.type]
    }

    if (RuleAction.Route === raw.action) {
      rule.outbound = OutboundsIds[raw.outbound]
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
        server.predefined = Object.entries<string[] | string>(raw.predefined).map(
          ([key, value]) => ({
            [key]: Array.isArray(value) ? value.join(',') : value,
          }),
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
    if (!raw.action) return []
    const rule = Defaults.DefaultDnsRule()
    rule.id = 'rule-' + i
    rule.action = raw.action

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
      rule.payload = raw[rule.type].map((tag: string) => RouteRuleSetIds[tag]).join(',')
    } else {
      rule.payload = raw[rule.type]
    }

    if (RuleAction.Route === raw.action) {
      if ('server' in raw) {
        rule.server = DnsServersIds[raw.server]
      }
      if ('strategy' in raw) {
        rule.strategy = raw.strategy
      }
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
