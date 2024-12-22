import { Inbound, Outbound, RuleAction, Strategy, TunStack } from '@/enums/kernel'
import { deepAssign, sampleID } from './others'
import * as Defaults from '@/constant/profile'

export const restoreProfile = (config: Recordable) => {
  const profile: IProfile = {
    id: sampleID(),
    name: sampleID(),
    log: Defaults.DefaultLog(),
    experimental: Defaults.DefaultExperimental(),
    inbounds: [],
    outbounds: [],
    route: {
      rule_set: [],
      rules: [],
      auto_detect_interface: true,
      default_interface: '',
      final: ''
    },
    dns: {
      servers: [],
      rules: [],
      fakeip: {
        enabled: false,
        inet4_range: '198.18.0.0/15',
        inet6_range: 'fc00::/18'
      },
      disable_cache: false,
      disable_expire: false,
      independent_cache: false,
      client_subnet: '',
      final: '',
      strategy: Strategy.Default
    },
    mixin: Defaults.DefaultMixin(),
    script: Defaults.DefaultScript()
  }

  const InboundsIds = config.inbounds.reduce(
    (p: any, c: any) => ({ ...p, [c.tag]: sampleID() }),
    {}
  )
  const OutboundsIds = config.outbounds.reduce(
    (p: any, c: any) => ({ ...p, [c.tag]: sampleID() }),
    {}
  )
  // const RulesetIds = config.route.rule_set.reduce(
  //   (p: any, c: any) => ({ ...p, [c.tag]: sampleID() }),
  //   {}
  // )
  const DnsServersIds = config.dns.servers.reduce(
    (p: any, c: any) => ({ ...p, [c.tag]: sampleID() }),
    {}
  )

  Object.entries(config).forEach(([field, value]) => {
    if (field === 'log') {
      deepAssign(profile[field], value)
    } else if (field === 'experimental') {
      deepAssign(profile[field], value)
    } else if (field === 'inbounds') {
      profile.inbounds = value.map((inbound: any) => {
        const extra = {
          id: InboundsIds[inbound.tag],
          tag: inbound.tag,
          type: inbound.type,
          enable: true
        }
        if (inbound.type === Inbound.Tun) {
          return {
            ...extra,
            tun: {
              interface_name: inbound.interface_name || '',
              address: inbound.address || ['172.18.0.1/30', 'fdfe:dcba:9876::1/126'],
              mtu: inbound.mtu || 9000,
              auto_route: !!inbound.auto_route,
              strict_route: !!inbound.strict_route,
              route_address: inbound.route_address || [
                '0.0.0.0/1',
                '128.0.0.0/1',
                '::/1',
                '8000::/1'
              ],
              endpoint_independent_nat: !!inbound.endpoint_independent_nat,
              stack: inbound.stack || TunStack.Mixed
            }
          }
        }
        if ([Inbound.Mixed, Inbound.Http, Inbound.Socks].includes(inbound.type)) {
          return {
            ...extra,
            [inbound.type]: {
              listen: {
                listen: inbound.listen,
                listen_port: inbound.listen_port,
                tcp_fast_open: !!inbound.tcp_fast_open,
                tcp_multi_path: !!inbound.tcp_multi_path,
                udp_fragment: !!inbound.udp_fragment
              },
              users: (inbound.users || []).map((user: any) => user.username + ':' + user.password)
            }
          }
        }
      })
    } else if (field === 'outbounds') {
      profile.outbounds = value.flatMap((outbound: any) => {
        if (![Outbound.Selector, Outbound.Direct, Outbound.Urltest].includes(outbound.type)) {
          return []
        }
        const extra: Recordable = Defaults.DefaultOutbound()
        extra.id = OutboundsIds[outbound.tag]
        extra.tag = outbound.tag
        if (outbound.outbounds) {
          extra.outbounds = outbound.outbounds.flatMap((tag: string) => {
            if (!OutboundsIds[tag]) {
              return []
            }
            return {
              id: OutboundsIds[tag],
              type: 'Built-in',
              tag
            }
          })
        }
        return {
          ...extra
        }
      })
    } else if (field === 'route') {
    } else if (field === 'dns') {
      profile.dns = {
        fakeip: value.fakeip,
        disable_cache: value.disable_cache ?? false,
        disable_expire: value.disable_expire ?? false,
        independent_cache: value.independent_cache ?? false,
        final: DnsServersIds[value.final] || Strategy.Default,
        strategy: value.strategy || Strategy.Default,
        client_subnet: value.client_subnet || '',
        servers: value.servers.map((server: any) => {
          return {
            id: DnsServersIds[server.tag],
            tag: server.tag,
            address: server.address,
            address_resolver: DnsServersIds[server.address_resolver] || '',
            detour: OutboundsIds[server.detour] || '',
            strategy: server.strategy || Strategy.Default,
            client_subnet: server.client_subnet || ''
          }
        }),
        rules: value.rules.map((rule: any) => {
          const extra: Recordable = {}

          return {
            id: '',
            type: '',
            action: rule.action || RuleAction.Route,
            server: DnsServersIds[rule.server] || '',
            ...extra
          }
        })
      }
    }
  })

  return profile
}
