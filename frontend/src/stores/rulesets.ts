import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parse } from 'yaml'

import { ReadFile, WriteFile, CopyFile, Download, HttpGet } from '@/bridge'
import { RulesetHubFilePath, RulesetsFilePath } from '@/constant/app'
import { EmptyRuleSet } from '@/constant/kernel'
import { RulesetFormat } from '@/enums/kernel'
import {
  asyncPool,
  stringifyNoFolding,
  eventBus,
  ignoredError,
  isValidRulesJson,
  omitArray,
} from '@/utils'

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
    const data = await ignoredError(ReadFile, RulesetsFilePath)
    data && (rulesets.value = parse(data))

    const list = await ignoredError(ReadFile, RulesetHubFilePath)
    list && (rulesetHub.value = JSON.parse(list))
  }

  const saveRulesets = () => {
    const r = omitArray(rulesets.value, ['updating'])
    return WriteFile(RulesetsFilePath, stringifyNoFolding(r))
  }

  const addRuleset = async (r: RuleSet) => {
    rulesets.value.push(r)
    try {
      await saveRulesets()
    } catch (error) {
      const idx = rulesets.value.indexOf(r)
      if (idx !== -1) {
        rulesets.value.splice(idx, 1)
      }
      throw error
    }
  }

  const deleteRuleset = async (id: string) => {
    const idx = rulesets.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = rulesets.value.splice(idx, 1)[0]!
    try {
      await saveRulesets()
    } catch (error) {
      rulesets.value.splice(idx, 0, backup)
      throw error
    }

    eventBus.emit('rulesetChange', { id })
  }

  const editRuleset = async (id: string, r: RuleSet) => {
    const idx = rulesets.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = rulesets.value.splice(idx, 1, r)[0]!
    try {
      await saveRulesets()
    } catch (error) {
      rulesets.value.splice(idx, 1, backup)
      throw error
    }

    eventBus.emit('rulesetChange', { id })
  }

  const _doUpdateRuleset = async (r: RuleSet) => {
    if (r.format === RulesetFormat.Source) {
      let body = ''
      let isExist = true

      if (r.type === 'File') {
        body = await ReadFile(r.url)
      } else if (r.type === 'Http') {
        const { body: b } = await HttpGet(r.url)
        body = b
        if (typeof body !== 'string') {
          body = JSON.stringify(body)
        }
      } else if (r.type === 'Manual') {
        body = await ReadFile(r.path).catch(() => '')
        if (!body) {
          body = JSON.stringify(EmptyRuleSet)
          isExist = false
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
        await WriteFile(r.path, JSON.stringify(ruleset, null, 2))
      }
    }

    if (r.format === RulesetFormat.Binary) {
      if (r.type === 'File' && r.url !== r.path) {
        await CopyFile(r.url, r.path)
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
    } finally {
      r.updating = false
    }

    eventBus.emit('rulesetChange', { id })

    return `Ruleset [${r.tag}] updated successfully.`
  }

  const updateRulesets = async () => {
    let needSave = false

    const update = async (r: RuleSet) => {
      const result = { ok: true, id: r.id, name: r.tag, result: '' }
      try {
        r.updating = true
        await _doUpdateRuleset(r)
        needSave = true
        result.result = `Rule-Set [${r.tag}] updated successfully.`
      } catch (error: any) {
        result.ok = false
        result.result = `Failed to update rule-set [${r.tag}]. Reason: ${error.message || error}`
      } finally {
        r.updating = false
      }
      return result
    }

    const result = await asyncPool(
      5,
      rulesets.value.filter((v) => !v.disabled),
      update,
    )

    if (needSave) await saveRulesets()

    eventBus.emit('rulesetsChange', undefined)

    return result.flatMap((v) => (v.ok && v.value) || [])
  }

  const rulesetHubLoading = ref(false)
  const updateRulesetHub = async () => {
    rulesetHubLoading.value = true
    try {
      const { body } = await HttpGet<string>(
        'https://github.com/GUI-for-Cores/Ruleset-Hub/releases/download/latest/sing-full.json',
      )
      rulesetHub.value = JSON.parse(body)
      await WriteFile(RulesetHubFilePath, body)
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
