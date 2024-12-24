import {
  ClashMode,
  Inbound,
  Outbound,
  TunStack,
  LogLevel,
  RuleType,
  RulesetFormat,
  RulesetType,
  RuleAction,
  Sniffer,
  Strategy,
  RuleActionReject,
} from '@/enums/kernel'

export const CoreWorkingDirectory = 'data/sing-box'
export const CoreConfigFilePath = CoreWorkingDirectory + '/config.json'
export const CoreCacheFilePath = CoreWorkingDirectory + '/cache.db'

export const ModeOptions = [
  {
    label: 'kernel.global',
    value: ClashMode.Global,
    desc: 'kernel.globalDesc',
  },
  {
    label: 'kernel.rule',
    value: ClashMode.Rule,
    desc: 'kernel.ruleDesc',
  },
  {
    label: 'kernel.direct',
    value: ClashMode.Direct,
    desc: 'kernel.directDesc',
  },
]

export const LogLevelOptions = [
  {
    label: 'kernel.log.trace',
    value: LogLevel.Trace,
  },
  {
    label: 'kernel.log.debug',
    value: LogLevel.Debug,
  },
  {
    label: 'kernel.log.info',
    value: LogLevel.Info,
  },
  {
    label: 'kernel.log.warn',
    value: LogLevel.Warn,
  },
  {
    label: 'kernel.log.error',
    value: LogLevel.Error,
  },
  {
    label: 'kernel.log.fatal',
    value: LogLevel.Fatal,
  },
  {
    label: 'kernel.log.panic',
    value: LogLevel.Panic,
  },
]

export const InboundOptions = [
  { label: 'mixed', value: Inbound.Mixed },
  { label: 'socks', value: Inbound.Socks },
  { label: 'http', value: Inbound.Http },
  { label: 'tun', value: Inbound.Tun },
]

export const OutboundOptions = [
  { label: 'kernel.outbounds.direct', value: Outbound.Direct },
  { label: 'kernel.outbounds.selector', value: Outbound.Selector },
  { label: 'kernel.outbounds.urltest', value: Outbound.Urltest },
]

export const RulesTypeOptions = [
  {
    label: 'kernel.rules.type.inbound',
    value: RuleType.Inbound,
  },
  {
    label: 'kernel.rules.type.network',
    value: RuleType.Network,
  },
  {
    label: 'kernel.rules.type.protocol',
    value: RuleType.Protocol,
  },
  {
    label: 'kernel.rules.type.domain',
    value: RuleType.Domain,
  },
  {
    label: 'kernel.rules.type.domain_suffix',
    value: RuleType.DomainSuffix,
  },
  {
    label: 'kernel.rules.type.domain_keyword',
    value: RuleType.DomainKeyword,
  },
  {
    label: 'kernel.rules.type.domain_regex',
    value: RuleType.DomainRegex,
  },
  {
    label: 'kernel.rules.type.source_ip_cidr',
    value: RuleType.SourceIPCidr,
  },
  {
    label: 'kernel.rules.type.ip_cidr',
    value: RuleType.IPCidr,
  },
  {
    label: 'kernel.rules.type.ip_is_private',
    value: RuleType.IpIsPrivate,
  },
  {
    label: 'kernel.rules.type.source_port',
    value: RuleType.SourcePort,
  },
  {
    label: 'kernel.rules.type.source_port_range',
    value: RuleType.SourcePortRange,
  },
  {
    label: 'kernel.rules.type.port',
    value: RuleType.Port,
  },
  {
    label: 'kernel.rules.type.port_range',
    value: RuleType.PortRange,
  },
  {
    label: 'kernel.rules.type.process_name',
    value: RuleType.ProcessName,
  },
  {
    label: 'kernel.rules.type.process_path',
    value: RuleType.ProcessPath,
  },
  {
    label: 'kernel.rules.type.process_path_regex',
    value: RuleType.ProcessPathRegex,
  },
  {
    label: 'kernel.rules.type.clash_mode',
    value: RuleType.ClashMode,
  },
  {
    label: 'kernel.rules.type.rule_set',
    value: RuleType.RuleSet,
  },
  {
    label: 'kernel.rules.type.inline',
    value: RuleType.Inline,
  },
]

export const DnsRuleTypeOptions = RulesTypeOptions.concat([
  {
    label: 'kernel.rules.type.outbound',
    value: RuleType.Outbound,
  },
])

export const TunStackOptions = [
  { label: 'kernel.inbounds.tun.system', value: TunStack.System },
  { label: 'kernel.inbounds.tun.gvisor', value: TunStack.GVisor },
  { label: 'kernel.inbounds.tun.mixed', value: TunStack.Mixed },
]

export const RulesetTypeOptions = [
  { label: 'kernel.route.rule_set.type.inline', value: RulesetType.Inline },
  { label: 'kernel.route.rule_set.type.local', value: RulesetType.Local },
  { label: 'kernel.route.rule_set.type.remote', value: RulesetType.Remote },
]

export const RulesetFormatOptions = [
  { label: 'ruleset.format.source', value: RulesetFormat.Source },
  { label: 'ruleset.format.binary', value: RulesetFormat.Binary },
]

export const DomainStrategyOptions = [
  { label: 'kernel.strategy.default', value: Strategy.Default },
  { label: 'kernel.strategy.prefer_ipv4', value: Strategy.PreferIPv4 },
  { label: 'kernel.strategy.prefer_ipv6', value: Strategy.PreferIPv6 },
  { label: 'kernel.strategy.ipv4_only', value: Strategy.IPv4Only },
  { label: 'kernel.strategy.ipv6_only', value: Strategy.IPv6Only },
]

export const RuleActionOptions = [
  { label: 'kernel.route.rules.action.route', value: RuleAction.Route },
  { label: 'kernel.route.rules.action.route-options', value: RuleAction.RouteOptions },
  { label: 'kernel.route.rules.action.reject', value: RuleAction.Reject },
  { label: 'kernel.route.rules.action.hijack-dns', value: RuleAction.HijackDNS },
  { label: 'kernel.route.rules.action.sniff', value: RuleAction.Sniff },
  { label: 'kernel.route.rules.action.resolve', value: RuleAction.Resolve },
]

export const DnsRuleActionOptions = [
  { label: 'kernel.route.rules.action.route', value: RuleAction.Route },
  { label: 'kernel.route.rules.action.route-options', value: RuleAction.RouteOptions },
  { label: 'kernel.route.rules.action.reject', value: RuleAction.Reject },
]

export const DnsRuleActionRejectOptions = [
  { label: 'kernel.route.rules.action.rejectDefault', value: RuleActionReject.Default },
  { label: 'kernel.route.rules.action.rejectDrop', value: RuleActionReject.Drop },
]

export const RuleSnifferOptions = [
  { label: 'kernel.route.rules.sniffer.http', value: Sniffer.Http },
  { label: 'kernel.route.rules.sniffer.tls', value: Sniffer.Tls },
  { label: 'kernel.route.rules.sniffer.quic', value: Sniffer.Quic },
  { label: 'kernel.route.rules.sniffer.dns', value: Sniffer.Dns },
  { label: 'kernel.route.rules.sniffer.ssh', value: Sniffer.Ssh },
  { label: 'kernel.route.rules.sniffer.rdp', value: Sniffer.Rdp },
]

export const EmptyRuleSet = {
  version: 1,
  rules: [],
}

export const DefaultExcludeProtocols = 'direct|reject|selector|urltest|block|dns|shadowsocksr'
