import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stringify, parse } from 'yaml'

import { Readfile, Writefile, Copyfile, Download, FileExists, HttpGet } from '@/bridge'
import { RulesetHubFilePath, RulesetsFilePath } from '@/constant/app'
import { EmptyRuleSet } from '@/constant/kernel'
import { RulesetFormat } from '@/enums/kernel'
import { asyncPool, debounce, ignoredError, isValidRulesJson, omitArray } from '@/utils'

export interface RuleSet {
  id: string
  tag: string
  updateTime: number
  disabled: boolean
  type: 'Http' | 'File' | 'Manual'
  format: RulesetFormat
  path: string
  url: string
  count: number
  // Not Config
  updating?: boolean
}

export interface RuleSetHub {
  geosite: string
  geoip: string
  list: { name: string; type: 'geosite' | 'geoip'; description: string; count: number }[]
}

export const useRulesetsStore = defineStore('rulesets', () => {
  const rulesets = ref<RuleSet[]>([])
  const rulesetHub = ref<RuleSetHub>({ geosite: '', geoip: '', list: [] })

  const setupRulesets = async () => {
    const data = await ignoredError(Readfile, RulesetsFilePath)
    data && (rulesets.value = parse(data))

    const list = await ignoredError(Readfile, RulesetHubFilePath)
    list && (rulesetHub.value = JSON.parse(list))
  }

  const saveRulesets = debounce(async () => {
    const r = omitArray(rulesets.value, ['updating'])
    await Writefile(RulesetsFilePath, stringify(r))
  }, 500)

  const addRuleset = async (r: RuleSet) => {
    rulesets.value.push(r)
    try {
      await saveRulesets()
    } catch (error) {
      rulesets.value.pop()
      throw error
    }
  }

  const deleteRuleset = async (id: string) => {
    const idx = rulesets.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = rulesets.value.splice(idx, 1)[0]
    try {
      await saveRulesets()
    } catch (error) {
      rulesets.value.splice(idx, 0, backup)
      throw error
    }
  }

  const editRuleset = async (id: string, r: RuleSet) => {
    const idx = rulesets.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = rulesets.value.splice(idx, 1, r)[0]
    try {
      await saveRulesets()
    } catch (error) {
      rulesets.value.splice(idx, 1, backup)
      throw error
    }
  }

  const _doUpdateRuleset = async (r: RuleSet) => {
    if (r.format === RulesetFormat.Source) {
      let body = ''
      let isExist = true

      if (r.type === 'File') {
        body = await Readfile(r.url)
      } else if (r.type === 'Http') {
        const { body: b } = await HttpGet(r.url)
        body = b
        if (typeof body !== 'string') {
          body = JSON.stringify(body)
        }
      } else if (r.type === 'Manual') {
        isExist = await FileExists(r.path)
        if (isExist) {
          body = await Readfile(r.path)
        } else {
          body = JSON.stringify(EmptyRuleSet)
        }
      }

      if (!isValidRulesJson(body)) {
        throw 'Not a valid ruleset data'
      }

      const ruleset = JSON.parse(body)

      r.count = ruleset.rules.reduce(
        (p: number, c: string[]) =>
          Object.values(c).reduce(
            (p, c: string[] | string) => (Array.isArray(c) ? p + c.length : p + 1),
            0,
          ) + p,
        0,
      )

      if (
        (['Http', 'File'].includes(r.type) && r.url !== r.path) ||
        (r.type === 'Manual' && !isExist)
      ) {
        await Writefile(r.path, JSON.stringify(ruleset, null, 2))
      }
    }

    if (r.format === RulesetFormat.Binary) {
      if (r.type === 'File' && r.url !== r.path) {
        await Copyfile(r.url, r.path)
      } else if (r.type === 'Http') {
        await Download(r.url, r.path)
      }
    }

    r.updateTime = Date.now()
  }

  const updateRuleset = async (id: string) => {
    const r = rulesets.value.find((v) => v.id === id)
    if (!r) throw id + ' Not Found'
    if (r.disabled) throw r.tag + ' Disabled'
    try {
      r.updating = true
      await _doUpdateRuleset(r)
      await saveRulesets()
      return `Ruleset [${r.tag}] updated successfully.`
    } finally {
      r.updating = false
    }
  }

  const updateRulesets = async () => {
    let needSave = false

    const update = async (r: RuleSet) => {
      try {
        r.updating = true
        await _doUpdateRuleset(r)
        needSave = true
      } finally {
        r.updating = false
      }
    }

    await asyncPool(
      5,
      rulesets.value.filter((v) => !v.disabled),
      update,
    )

    if (needSave) saveRulesets()
  }

  const rulesetHubLoading = ref(false)
  const updateRulesetHub = async () => {
    rulesetHubLoading.value = true
    try {
      const { body } = await HttpGet<string>(
        'https://github.com/GUI-for-Cores/Ruleset-Hub/releases/download/latest/sing-full.json',
      )
      rulesetHub.value = JSON.parse(body)
      await Writefile(RulesetHubFilePath, body)
    } finally {
      rulesetHubLoading.value = false
    }
  }

  const getRulesetById = (id: string) => rulesets.value.find((v) => v.id === id)

  return {
    rulesets,
    setupRulesets,
    saveRulesets,
    addRuleset,
    editRuleset,
    deleteRuleset,
    updateRuleset,
    updateRulesets,
    getRulesetById,

    rulesetHub,
    rulesetHubLoading,
    updateRulesetHub,
  }
})
