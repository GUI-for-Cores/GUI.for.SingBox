import { Readfile, Writefile } from '@/bridge'
import { CoreConfigFilePath } from '@/constant/kernel'
import { deepAssign, deepClone } from './others'
import { Inbound, Outbound, RuleAction, RulesetType, RuleType, Strategy } from '@/enums/kernel'
import { usePluginsStore, useRulesetsStore, useSubscribesStore } from '@/stores'

const _generateRule = (rule: IRule, rule_set: IRuleSet[], inbounds: IInbound[]) => {
  const getInbound = (id: string) => inbounds.find((v) => v.id === id)?.tag
  const getRuleset = (id: string) => rule_set.find((v) => v.id === id)?.tag

  const extra: Recordable = {}
  if (rule.type === RuleType.Inline) {
    deepAssign(extra, JSON.parse(rule.payload))
  } else if (rule.type === RuleType.RuleSet) {
    extra[rule.type] = getRuleset(rule.payload)
  } else if (rule.type === RuleType.Inbound) {
    extra[rule.type] = getInbound(rule.payload)
  } else if (rule.type === RuleType.IpIsPrivate) {
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

const generateExperimental = (experimental: IExperimental, outbounds: IOutbound[]) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  return {
    clash_api: {
      ...experimental.clash_api,
      external_ui_download_detour: getOutbound(experimental.clash_api.external_ui_download_detour),
    },
    cache_file: experimental.cache_file,
  }
}

const generateInbounds = (inbounds: IInbound[]) => {
  return inbounds.flatMap((inbound) => {
    if (!inbound.enable) return []
    if (inbound.type !== Inbound.Tun) {
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound[inbound.type]!.listen,
        users: inbound[inbound.type]!.users.map((user) => ({
          username: user.split(':')[0],
          password: user.split(':')[1],
        })),
      }
    }
    if (inbound.type === Inbound.Tun) {
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound.tun!,
      }
    }
  })
}

const generateOutbounds = async (outbounds: IOutbound[]) => {
  const result: Recordable[] = []
  const SubscriptionCache: Recordable<any[]> = {}
  const proxiesSet = new Set<any>()

  const createTagMatcher = (include: string, exclude: string) => {
    const includeRegex = include ? new RegExp(include) : null
    const excludeRegex = exclude ? new RegExp(exclude) : null
    return (tag: string) => {
      const flag1 = includeRegex ? includeRegex.test(tag) : true
      const flag2 = excludeRegex ? !excludeRegex.test(tag) : true
      return flag1 && flag2
    }
  }

  const subscribesStore = useSubscribesStore()

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
      const isTagMatching = createTagMatcher(outbound.include, outbound.exclude)
      for (const proxy of outbound.outbounds) {
        if (proxy.type === 'Built-in') {
          _outbound.outbounds.push(proxy.tag)
        } else {
          const subId = proxy.type === 'Subscription' ? proxy.id : proxy.type
          if (!SubscriptionCache[subId]) {
            const sub = subscribesStore.getSubscribeById(subId)
            if (sub) {
              const subStr = await Readfile(sub.path)
              const proxies = JSON.parse(subStr)
              SubscriptionCache[subId] = proxies
            }
          }
          if (proxy.type === 'Subscription') {
            _outbound.outbounds.push(
              ...SubscriptionCache[subId].map((v) => v.tag).filter((tag) => isTagMatching(tag)),
            )
            SubscriptionCache[subId].forEach((v) => proxiesSet.add(v))
          } else {
            const _proxy = SubscriptionCache[subId].find((v) => v.tag === proxy.tag)
            if (_proxy && isTagMatching(_proxy.tag)) {
              _outbound.outbounds.push(_proxy.tag)
              proxiesSet.add(_proxy)
            }
          }
        }
      }
    }
    result.push(_outbound)
  }

  result.push(...proxiesSet)

  return result
}

const generateRoute = (route: IRoute, inbounds: IInbound[], outbounds: IOutbound[], dns: IDNS) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag

  const rulesetsStore = useRulesetsStore()

  const extra: Recordable = {}
  if (!route.auto_detect_interface) {
    extra.default_interface = route.default_interface
  }
  return {
    rules: route.rules.map((rule) => {
      const extra: Recordable = _generateRule(rule, route.rule_set, inbounds)

      if (rule.action === RuleAction.Route) {
        extra.outbound = getOutbound(rule.outbound)
      } else if (rule.action === RuleAction.RouteOptions) {
        deepAssign(extra, JSON.parse(rule.outbound))
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
      return {
        action: rule.action,
        ...extra,
      }
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
        if (extra.update_interval) {
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
    final: getOutbound(route.final),
    ...extra,
  }
}

const generateDns = (
  dns: IDNS,
  rule_set: IRuleSet[],
  inbounds: IInbound[],
  outbounds: IOutbound[],
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const extra: Recordable = {}
  if (dns.strategy !== Strategy.Default) {
    extra.strategy = dns.strategy
  }
  if (dns.client_subnet) {
    extra.client_subnet = dns.client_subnet
  }
  return {
    servers: dns.servers.flatMap((server) => {
      if (server.address === 'fakeip' && !dns.fakeip.enabled) return []
      const extra: Recordable = {}
      if (server.client_subnet) {
        extra.client_subnet = server.client_subnet
      }
      if (server.strategy !== Strategy.Default) {
        extra.strategy = server.strategy
      }
      return {
        tag: server.tag,
        address: server.address,
        address_resolver: getDnsServer(server.address_resolver),
        detour: getOutbound(server.detour),
        ...extra,
      }
    }),
    rules: dns.rules.flatMap((rule) => {
      const extra: Recordable = _generateRule(rule as IRule, rule_set, inbounds)
      if (rule.type === RuleType.Inline && rule.payload.includes('__is_fake_ip')) {
        if (!dns.fakeip.enabled) return []
        delete extra.__is_fake_ip
      }
      if (rule.action === RuleAction.RouteOptions) {
        deepAssign(extra, JSON.parse(rule.server))
      } else if (rule.action === RuleAction.Reject) {
        extra.method = rule.server
      }
      return {
        action: rule.action,
        server: getDnsServer(rule.server),
        ...extra,
      }
    }),
    fakeip: dns.fakeip,
    disable_cache: dns.disable_cache,
    disable_expire: dns.disable_expire,
    independent_cache: dns.independent_cache,
    final: getDnsServer(dns.final),
    ...extra,
  }
}

export const generateConfig = async (originalProfile: IProfile) => {
  const profile = deepClone(originalProfile)
  // step 1
  const config: Recordable<any> = {
    log: profile.log,
    experimental: generateExperimental(profile.experimental, profile.outbounds),
    inbounds: generateInbounds(profile.inbounds),
    outbounds: await generateOutbounds(profile.outbounds),
    route: generateRoute(profile.route, profile.inbounds, profile.outbounds, profile.dns),
    dns: generateDns(profile.dns, profile.route.rule_set, profile.inbounds, profile.outbounds),
  }

  // step 2
  const { priority, config: mixin } = originalProfile.mixin
  if (priority === 'mixin') {
    deepAssign(config, JSON.parse(mixin))
  } else if (priority === 'gui') {
    deepAssign(config, deepAssign(JSON.parse(mixin), config))
  }

  // step 3
  const fn = new window.AsyncFunction(
    `${profile.script.code};return await onGenerate(${JSON.stringify(config)})`,
  )
  let _config
  try {
    _config = await fn()
  } catch (error: any) {
    throw error.message || error
  }

  if (typeof _config !== 'object') {
    throw 'Wrong result'
  }

  // step 4
  const pluginsStore = usePluginsStore()
  const result = await pluginsStore.onGenerateTrigger(_config, originalProfile)

  return result
}

export const generateConfigFile = async (profile: IProfile) => {
  const config = await generateConfig(profile)

  config.log.disabled = false
  config.log.level = 'debug'
  config.log.output = ''

  await Writefile(CoreConfigFilePath, JSON.stringify(config, null, 2))
}
