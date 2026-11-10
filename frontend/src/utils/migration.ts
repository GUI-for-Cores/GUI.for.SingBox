import { DefaultPluginHubSources } from '@/constant/app'
import { RequestProxyMode, WindowStartState } from '@/enums/app'
import { Inbound, TunDnsMode } from '@/enums/kernel'
import { useEnvStore } from '@/stores'

export const migrateAppSettings = async (
  settings: App.AppSettings,
  save: () => Promise<string>,
) => {
  let needSync = false

  const { os } = useEnvStore().env

  if ('darwinSystemProxyServices' in settings) {
    settings.systemProxyServices = settings.darwinSystemProxyServices as string[]
    delete settings.darwinSystemProxyServices
    needSync = true
  }
  if (
    !settings.systemProxyServices ||
    (os === 'linux' && settings.systemProxyServices.join(',') === 'Ethernet,Wi-Fi')
  ) {
    settings.systemProxyServices = os === 'darwin' ? ['Ethernet', 'Wi-Fi'] : []
    needSync = true
  }
  if (settings.autoSetSystemDNS === undefined) {
    settings.autoSetSystemDNS = false
    needSync = true
  }
  if (settings.systemProxyDNS === undefined) {
    settings.systemProxyDNS = ''
    needSync = true
  }
  if (settings.systemDefaultDNS === undefined) {
    settings.systemDefaultDNS = ''
    needSync = true
  }
  if (!settings.requestProxyMode) {
    settings.requestProxyMode = RequestProxyMode.System
    needSync = true
  }
  if (settings.customProxy === undefined) {
    settings.customProxy = ''
    needSync = true
  }
  if (settings.githubDownloadAcceleration === undefined) {
    settings.githubDownloadAcceleration = false
    needSync = true
  }
  if (settings.githubDownloadMirror === undefined) {
    settings.githubDownloadMirror = ''
    needSync = true
  }
  if (!settings.plugins) {
    settings.plugins = {
      sources: DefaultPluginHubSources(),
    }
    needSync = true
  }
  for (const source of settings.plugins.sources) {
    const name = ['generic', 'gfc', 'gfs'].find(
      (name) =>
        source.url ===
        `https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/${name}.json`,
    )
    if (name) {
      source.url = `https://api.github.com/repos/GUI-for-Cores/Plugin-Hub/contents/plugins/${name}.json?ref=main`
      needSync = true
    }
  }
  if (settings.debugUsePointer === undefined) {
    settings.debugUsePointer = false
    needSync = true
  }
  if (settings.debugModalSideBySide === undefined) {
    settings.debugModalSideBySide = false
    needSync = true
  }
  if (settings.systemTitleBar === undefined) {
    settings.systemTitleBar = false
    needSync = true
  }
  if (typeof settings.windowStartState === 'number') {
    settings.windowStartState =
      settings.windowStartState === 2 ? WindowStartState.Minimised : WindowStartState.Normal
    needSync = true
  }
  for (const core of [settings.kernel.main, settings.kernel.alpha]) {
    const legacy = JSON.stringify(core)
    const migrated = legacy
      .replaceAll('$APP_BASE_PATH/$CORE_BASE_PATH', '$APP_DATA_PATH/sing-box')
      .replaceAll('$APP_BASE_PATH/data/', '$APP_DATA_PATH/')
    if (migrated !== legacy) {
      Object.assign(core, JSON.parse(migrated))
      needSync = true
    }
  }

  if (needSync) await save()
}

export const migrateProfiles = async (profiles: App.Profile[], save: () => Promise<string>) => {
  let needSync = false

  profiles.forEach((profile) => {
    profile.dns.rules.forEach((rule) => {
      if (typeof rule.enable === 'undefined') {
        rule.enable = true
        needSync = true
      }
      if (typeof rule.match_response === 'undefined') {
        rule.match_response = ''
        needSync = true
      }
      if (typeof rule.tag === 'undefined') {
        rule.tag = ''
        needSync = true
      }
      if ('strategy' in rule) {
        delete rule.strategy
        needSync = true
      }
    })
    profile.route.rules.forEach((rule) => {
      if (typeof rule.enable === 'undefined') {
        rule.enable = true
        needSync = true
      }
    })
    const legacyRulesets = profile.route.rule_set.filter((ruleset) => 'download_detour' in ruleset)
    const legacyDetours = new Set(
      legacyRulesets.map(
        (ruleset) =>
          (ruleset as App.ProfileRuleSet & { download_detour?: string }).download_detour || '',
      ),
    )
    const canUseGlobalDetour =
      typeof profile.route.default_http_client === 'undefined' && legacyDetours.size === 1
    if (canUseGlobalDetour) {
      profile.route.default_http_client = legacyDetours.values().next().value || ''
      needSync = true
    }
    legacyRulesets.forEach((ruleset) => {
      const legacyRuleset = ruleset as App.ProfileRuleSet & { download_detour?: string }
      if (!canUseGlobalDetour) {
        ruleset.http_client = legacyRuleset.download_detour || ''
      }
      delete legacyRuleset.download_detour
      needSync = true
    })
    profile.route.rule_set.forEach((ruleset) => {
      if (typeof ruleset.http_client === 'undefined') {
        ruleset.http_client = ''
        needSync = true
      }
    })
    if ('independent_cache' in profile.dns) {
      delete profile.dns.independent_cache
      needSync = true
    }
    if (typeof profile.dns.optimistic === 'undefined') {
      profile.dns.optimistic = {
        enabled: false,
        timeout: '3d',
      }
      needSync = true
    }
    const store_rdrc = !!(profile.experimental.cache_file as any).store_rdrc
    if (typeof profile.experimental.cache_file.store_dns === 'undefined') {
      profile.experimental.cache_file.store_dns = store_rdrc
      needSync = true
    }
    if ('store_rdrc' in profile.experimental.cache_file) {
      delete profile.experimental.cache_file.store_rdrc
      needSync = true
    }
    if ('rdrc_timeout' in profile.experimental.cache_file) {
      delete profile.experimental.cache_file.rdrc_timeout
      needSync = true
    }
    if (typeof profile.route.default_http_client === 'undefined') {
      profile.route.default_http_client = ''
      needSync = true
    }
    profile.inbounds.forEach((inbound) => {
      if (
        inbound.type === Inbound.Tun &&
        inbound.tun &&
        typeof inbound.tun.dns_mode === 'undefined'
      ) {
        inbound.tun.dns_mode = TunDnsMode.Default
        needSync = true
      }
    })
  })

  if (needSync) await save()
}

export const migrateSubscribes = async (
  subscribes: App.Subscription[],
  save: () => Promise<string>,
) => {
  let needSync = false

  subscribes.forEach((subscribe) => {
    if (typeof subscribe.requestProxyMode === 'undefined') {
      subscribe.requestProxyMode = RequestProxyMode.System
      needSync = true
    }
    if (typeof subscribe.customProxy === 'undefined') {
      subscribe.customProxy = ''
      needSync = true
    }
  })

  if (needSync) await save()
}

export const migrateRulesets = async (rulesets: App.RuleSet[], save: () => Promise<string>) => {
  let needSync = false

  rulesets.forEach((ruleset) => {
    const legacyRuleset = ruleset as App.RuleSet & { tag?: string }

    if (typeof ruleset.name === 'undefined' && legacyRuleset.tag) {
      ruleset.name = legacyRuleset.tag
      delete legacyRuleset.tag
      needSync = true
    }
  })

  if (needSync) await save()
}
