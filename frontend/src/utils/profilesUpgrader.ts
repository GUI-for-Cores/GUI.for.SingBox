import * as Defaults from '@/constant/profile'
import { Strategy } from '@/enums/kernel'

export const transformProfileV189To190 = (config: Recordable) => {
  const profile: IProfile = {
    id: config.id,
    name: config.name,
    log: {
      disabled: false,
      level: config.generalConfig['log-level'] || 'info',
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
        default_mode: config.generalConfig,
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
    outbounds: Defaults.DefaultOutbounds(),
    route: Defaults.DefaultRoute(),
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
          detour: '',
          strategy: Strategy.Default,
          client_subnet: '',
        },
        {
          id: 'resolver-dns',
          tag: 'resolver-dns',
          address: config.dnsConfig['resolver-dns'],
          address_resolver: '',
          detour: '',
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
      rules: config.dnsRulesConfig.map((rule) => {}),
      fakeip: {
        enabled: config.dnsConfig['fake-ip'],
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
