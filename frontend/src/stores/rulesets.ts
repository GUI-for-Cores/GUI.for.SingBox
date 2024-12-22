import { ref } from 'vue'
import { defineStore } from 'pinia'
import { stringify, parse } from 'yaml'

import { debounce, ignoredError, isValidRulesJson, omitArray } from '@/utils'
import { EmptyRuleSet } from '@/constant/kernel'
import { RulesetsFilePath } from '@/constant/app'
import { RulesetFormat } from '@/enums/kernel'
import { Readfile, Writefile, Copyfile, Download, FileExists, HttpGet } from '@/bridge'

export type RuleSetType = {
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

export const useRulesetsStore = defineStore('rulesets', () => {
  const rulesets = ref<RuleSetType[]>([])

  const setupRulesets = async () => {
    const data = await ignoredError(Readfile, RulesetsFilePath)
    data && (rulesets.value = parse(data))
  }

  const saveRulesets = debounce(async () => {
    const r = omitArray(rulesets.value, ['updating'])
    await Writefile(RulesetsFilePath, stringify(r))
  }, 500)

  const addRuleset = async (r: RuleSetType) => {
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

  const editRuleset = async (id: string, r: RuleSetType) => {
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

  const _doUpdateRuleset = async (r: RuleSetType) => {
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
            0
          ) + p,
        0
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
    for (let i = 0; i < rulesets.value.length; i++) {
      const r = rulesets.value[i]
      if (r.disabled) continue
      try {
        r.updating = true
        await _doUpdateRuleset(r)
        needSave = true
      } finally {
        r.updating = false
      }
    }
    if (needSave) saveRulesets()
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
    getRulesetById
  }
})
