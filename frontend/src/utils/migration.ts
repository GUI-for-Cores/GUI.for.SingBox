import { RequestProxyMode } from '@/enums/app'


export const migrateProfiles = async (profiles: App.Profile[], save: () => Promise<string>) => {
  let needSync = false

  profiles.forEach((profile) => {
    profile.dns.rules.forEach((rule) => {
      if (typeof rule.enable === 'undefined') {
        rule.enable = true
        needSync = true
      }
    })
    profile.route.rules.forEach((rule) => {
      if (typeof rule.enable === 'undefined') {
        rule.enable = true
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
