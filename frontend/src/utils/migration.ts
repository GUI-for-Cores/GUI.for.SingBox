import { RequestProxyMode } from '@/enums/app'

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
