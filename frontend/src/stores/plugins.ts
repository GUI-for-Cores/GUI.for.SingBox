import { ref } from 'vue'
import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'

import { useAppSettingsStore } from '@/stores'
import { HttpGet, Readfile, Writefile } from '@/utils/bridge'
import { PluginsFilePath, PluginTrigger, PluginManualEvent } from '@/constant'
import { debounce, deepClone, ignoredError, isValidSubJson, APP_TITLE } from '@/utils'

export type PluginType = {
  id: string
  name: string
  description: string
  type: 'Http' | 'File'
  url: string
  path: string
  triggers: PluginTrigger[]
  menus: Record<string, string>
  disabled: boolean
  install: boolean
  installed: boolean
  // Not Config
  updating?: boolean
  loading?: boolean
  running?: boolean
}

const PluginsCache: Record<
  string,
  {
    plugin: PluginType
    code: string
  }
> = {}

const PluginsTriggerMap: {
  [key in PluginTrigger]: {
    fnName: string
    observers: string[]
  }
} = {
  [PluginTrigger.OnManual]: {
    fnName: 'onRun',
    observers: []
  },
  [PluginTrigger.OnSubscribe]: {
    fnName: 'onSubscribe',
    observers: []
  },
  [PluginTrigger.OnGenerate]: {
    fnName: 'onGenerate',
    observers: []
  },
  [PluginTrigger.OnStartup]: {
    fnName: 'onStartup',
    observers: []
  },
  [PluginTrigger.OnShutdown]: {
    fnName: 'onShutdown',
    observers: []
  },
  [PluginTrigger.OnUpdateRuleset]: {
    fnName: 'onUpdateRuleset',
    observers: []
  }
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export const usePluginsStore = defineStore('plugins', () => {
  const plugins = ref<PluginType[]>([])

  const setupPlugins = async () => {
    const data = await Readfile(PluginsFilePath)
    plugins.value = parse(data)

    for (let i = 0; i < plugins.value.length; i++) {
      const { id, triggers, path } = plugins.value[i]
      const code = await ignoredError(Readfile, path)
      if (code) {
        PluginsCache[id] = { plugin: plugins.value[i], code }
        triggers.forEach((trigger) => {
          PluginsTriggerMap[trigger].observers.push(id)
        })
      }
    }
  }

  const reloadPlugin = async (plugin: PluginType, code = '') => {
    const { path } = plugin
    if (!code) {
      code = await Readfile(path)
    }
    PluginsCache[plugin.id] = { plugin, code }
  }

  // FIXME: Plug-in execution order is wrong
  const updatePluginTrigger = (plugin: PluginType) => {
    const triggers = Object.keys(PluginsTriggerMap) as PluginTrigger[]
    triggers.forEach((trigger) => {
      PluginsTriggerMap[trigger].observers = PluginsTriggerMap[trigger].observers.filter(
        (v) => v !== plugin.id
      )
    })
    plugin.triggers.forEach((trigger) => {
      PluginsTriggerMap[trigger].observers.push(plugin.id)
    })
  }

  const savePlugins = debounce(async () => {
    const p = deepClone(plugins.value)
    for (let i = 0; i < p.length; i++) {
      delete p[i].updating
      delete p[i].loading
      delete p[i].running
    }
    await Writefile(PluginsFilePath, stringify(p))
  }, 100)

  const addPlugin = async (p: PluginType) => {
    plugins.value.push(p)
    try {
      await savePlugins()
    } catch (error) {
      plugins.value.pop()
      throw error
    }
  }

  const deletePlugin = async (id: string) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = plugins.value.splice(idx, 1)[0]
    const backupCode = PluginsCache[id]
    delete PluginsCache[id]
    try {
      await savePlugins()
    } catch (error) {
      plugins.value.splice(idx, 0, backup)
      PluginsCache[id] = backupCode
      throw error
    }
  }

  const editPlugin = async (id: string, p: PluginType) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = plugins.value.splice(idx, 1, p)[0]
    try {
      await savePlugins()
    } catch (error) {
      plugins.value.splice(idx, 1, backup)
      throw error
    }
  }

  const _doUpdatePlugin = async (plugin: PluginType) => {
    let code = ''

    if (plugin.type === 'File') {
      code = await Readfile(plugin.path)
    }

    if (plugin.type === 'Http') {
      const appSettings = useAppSettingsStore()
      const { body } = await HttpGet(plugin.url, {
        'User-Agent': appSettings.app.userAgent  || APP_TITLE
      })
      code = body
    }

    if (plugin.type !== 'File') {
      await Writefile(plugin.path, code)
    }

    PluginsCache[plugin.id] = { plugin, code }
  }

  const updatePlugin = async (id: string) => {
    const p = plugins.value.find((v) => v.id === id)
    if (!p) return
    if (p.disabled) return
    try {
      p.updating = true
      await _doUpdatePlugin(p)
      await savePlugins()
    } catch (error) {
      console.error('updatePlugin: ', p.name, error)
      throw error
    } finally {
      p.updating = false
    }
  }

  const updatePlugins = async () => {
    let needSave = false
    for (const plugin of plugins.value) {
      if (plugin.disabled) continue
      try {
        plugin.updating = true
        await _doUpdatePlugin(plugin)
        needSave = true
      } catch (error) {
        console.error('updatePlugins: ', plugin.name, error)
      } finally {
        plugin.updating = false
      }
    }
    if (needSave) savePlugins()
  }

  const getPluginById = (id: string) => plugins.value.find((v) => v.id === id)
  
  const getPluginCodefromCache = (id: string) => PluginsCache[id]?.code

  const onSubscribeTrigger = async (params: string) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnSubscribe]

    let result = params

    if (isValidSubJson(result)) {
      result = JSON.parse(result).outbounds ?? []
    } else {
      try {
        result = JSON.parse(result)
      } catch (error) {
        console.log(error)
      }
    }

    for (let i = 0; i < observers.length; i++) {
      const pluginId = observers[i]
      const cache = PluginsCache[pluginId]

      if (
        !cache ||
        !cache.plugin ||
        cache.plugin.disabled ||
        (cache.plugin.install && !cache.plugin.installed)
      )
        continue

      if (typeof result !== 'string') {
        result = JSON.stringify(result)
      } else {
        result = `\`${result}\``
      }

      try {
        const fn = new AsyncFunction(`${cache.code}; return await ${fnName}(${result})`)
        result = await fn(result)
      } catch (error: any) {
        throw `[${cache.plugin.name}] Error: ` + (error.message || error)
      }

      if (!Array.isArray(result)) {
        throw `[${cache.plugin.name}] Error: Wrong result`
      }
    }

    if (typeof result === 'string') {
      result = JSON.parse(result)
    }

    return result as unknown as Record<string, any>[]
  }

  const noParamsTrigger = async (trigger: PluginTrigger) => {
    const { fnName, observers } = PluginsTriggerMap[trigger]
    if (observers.length === 0) return

    for (let i = 0; i < observers.length; i++) {
      const pluginId = observers[i]
      const cache = PluginsCache[pluginId]

      if (
        !cache ||
        !cache.plugin ||
        cache.plugin.disabled ||
        (cache.plugin.install && !cache.plugin.installed)
      )
        continue

        try {
          const fn = new AsyncFunction(`${cache.code}; await ${fnName}()`)
          await await fn()
        } catch (error: any) {
          throw `[${cache.plugin.name}] Error: ` + (error.message || error)
        }
    }
    return
  }

  const onGenerateTrigger = async (params: Record<string, any>) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnGenerate]
    if (observers.length === 0) return params

    for (let i = 0; i < observers.length; i++) {
      const pluginId = observers[i]
      const cache = PluginsCache[pluginId]

      if (
        !cache ||
        !cache.plugin ||
        cache.plugin.disabled ||
        (cache.plugin.install && !cache.plugin.installed)
      )
        continue
        
      try {
        const fn = new AsyncFunction(
          `${cache.code}; return await ${fnName}(${JSON.stringify(params)})`
        )
        params = await fn()
      } catch (error: any) {
        throw `[${cache.plugin.name}] Error: ` + (error.message || error)
      }

      if (!params) throw `[${cache.plugin.name}] Error: Wrong result`
    }

    return params as Record<string, any>
  }

  const manualTrigger = async (plugin: PluginType, event: PluginManualEvent) => {
    const cache = PluginsCache[plugin.id]

    if (!cache) throw `[${plugin.name}]: Missing source code`
    if (cache.plugin.disabled) throw `[${plugin.name}]: Plugin disabled`
    try {
      const fn = new AsyncFunction(`${cache.code}; await ${event}()`)
      await fn()
    } catch (error: any) {
      throw `[${cache.plugin.name}] Error: ` + (error.message || error)
    }
  }

  return {
    plugins,
    setupPlugins,
    savePlugins,
    addPlugin,
    editPlugin,
    deletePlugin,
    updatePlugin,
    updatePlugins,
    getPluginById,
    reloadPlugin,
    onSubscribeTrigger,
    onGenerateTrigger,
    onStartupTrigger: () => noParamsTrigger(PluginTrigger.OnStartup),
    onShutdownTrigger: () => noParamsTrigger(PluginTrigger.OnShutdown),
    manualTrigger,
    updatePluginTrigger,
    getPluginCodefromCache
  }
})
