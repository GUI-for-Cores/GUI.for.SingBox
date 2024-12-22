import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'
import { computed, ref, watch } from 'vue'

import { HttpGet, Readfile, Writefile } from '@/bridge'
import { PluginsFilePath } from '@/constant/app'
import { PluginTrigger, PluginTriggerEvent } from '@/enums/app'
import { useAppSettingsStore, type SubscribeType } from '@/stores'
import { debounce, ignoredError, updateTrayMenus, isNumber, omitArray } from '@/utils'

export type PluginConfiguration = {
  id: string
  title: string
  description: string
  key: string
  component:
    | 'CheckBox'
    | 'CodeViewer'
    | 'Input'
    | 'InputList'
    | 'KeyValueEditor'
    | 'Radio'
    | 'Select'
    | 'Switch'
    | ''
  value: any
  options: any[]
}

export type PluginType = {
  id: string
  name: string
  description: string
  type: 'Http' | 'File'
  url: string
  path: string
  triggers: PluginTrigger[]
  menus: Record<string, string>
  configuration: PluginConfiguration[]
  disabled: boolean
  install: boolean
  installed: boolean
  status: number // 0: Normal 1: Running 2: Stopped
  // Not Config
  key?: string
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
    fnName: PluginTriggerEvent
    observers: string[]
  }
} = {
  [PluginTrigger.OnManual]: {
    fnName: PluginTriggerEvent.OnManual,
    observers: []
  },
  [PluginTrigger.OnSubscribe]: {
    fnName: PluginTriggerEvent.OnSubscribe,
    observers: []
  },
  [PluginTrigger.OnGenerate]: {
    fnName: PluginTriggerEvent.OnGenerate,
    observers: []
  },
  [PluginTrigger.OnStartup]: {
    fnName: PluginTriggerEvent.OnStartup,
    observers: []
  },
  [PluginTrigger.OnShutdown]: {
    fnName: PluginTriggerEvent.OnShutdown,
    observers: []
  },
  [PluginTrigger.OnReady]: {
    fnName: PluginTriggerEvent.OnReady,
    observers: []
  }
}

const getPluginMetadata = (plugin: PluginType) => {
  const appSettingsStore = useAppSettingsStore()
  let configuration = appSettingsStore.app.pluginSettings[plugin.id]
  if (!configuration) {
    configuration = {}
    plugin.configuration.forEach(({ key, value }) => (configuration[key] = value))
  }
  return { ...plugin, ...configuration }
}

const isPluginUnavailable = (cache: any) => {
  return (
    !cache ||
    !cache.plugin ||
    cache.plugin.disabled ||
    (cache.plugin.install && !cache.plugin.installed)
  )
}

export const usePluginsStore = defineStore('plugins', () => {
  const plugins = ref<PluginType[]>([])

  const setupPlugins = async () => {
    const data = await ignoredError(Readfile, PluginsFilePath)
    data && (plugins.value = parse(data))

    for (let i = 0; i < plugins.value.length; i++) {
      const { id, triggers, path, menus, configuration } = plugins.value[i]
      const code = await ignoredError(Readfile, path)
      if (code) {
        PluginsCache[id] = { plugin: plugins.value[i], code }
        triggers.forEach((trigger) => {
          PluginsTriggerMap[trigger].observers.push(id)
        })
      }
      if (menus === undefined) {
        plugins.value[i].menus = {}
      }
      if (configuration === undefined) {
        plugins.value[i].configuration = []
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
    const p = omitArray(plugins.value, ['key', 'updating', 'loading', 'running'])
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
      const { body } = await HttpGet(plugin.url)
      code = body
    }

    if (plugin.type !== 'File') {
      await Writefile(plugin.path, code)
    }

    PluginsCache[plugin.id] = { plugin, code }
  }

  const updatePlugin = async (id: string) => {
    const p = plugins.value.find((v) => v.id === id)
    if (!p) throw id + ' Not Found'
    if (p.disabled) throw p.name + ' Disabled'
    try {
      p.updating = true
      await _doUpdatePlugin(p)
      await savePlugins()
      return `Plugin [${p.name}] updated successfully.`
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
      } finally {
        plugin.updating = false
      }
    }
    if (needSave) savePlugins()
  }

  const getPluginById = (id: string) => plugins.value.find((v) => v.id === id)

  const getPluginCodefromCache = (id: string) => PluginsCache[id]?.code

  const onSubscribeTrigger = async (
    proxies: Record<string, any>[],
    subscription: SubscribeType
  ) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnSubscribe]

    let result = proxies

    for (let i = 0; i < observers.length; i++) {
      const pluginId = observers[i]
      const cache = PluginsCache[pluginId]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(`const Plugin = ${JSON.stringify(metadata)};
          ${cache.code};
          return await ${fnName}(${JSON.stringify(result)}, ${JSON.stringify(subscription)})
        `) as <T>(params: T) => Promise<T>
        result = await fn(result)
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }

      if (!Array.isArray(result)) {
        throw `${cache.plugin.name} : Wrong result`
      }
    }

    return result
  }

  const noParamsTrigger = async (trigger: PluginTrigger) => {
    const { fnName, observers } = PluginsTriggerMap[trigger]
    if (observers.length === 0) return

    for (let i = 0; i < observers.length; i++) {
      const pluginId = observers[i]
      const cache = PluginsCache[pluginId]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(
          `const Plugin = ${JSON.stringify(metadata)}; ${cache.code}; return await ${fnName}()`
        )
        const exitCode = await fn()
        if (isNumber(exitCode) && exitCode !== cache.plugin.status) {
          cache.plugin.status = exitCode
          editPlugin(cache.plugin.id, cache.plugin)
        }
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }
    }
    return
  }

  const onGenerateTrigger = async (params: Record<string, any>, profile: IProfile) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnGenerate]
    if (observers.length === 0) return params

    for (let i = 0; i < observers.length; i++) {
      const pluginId = observers[i]
      const cache = PluginsCache[pluginId]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(
          `const Plugin = ${JSON.stringify(metadata)}; ${cache.code}; return await ${fnName}(${JSON.stringify(params)}, ${JSON.stringify(profile)})`
        )
        params = await fn()
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }

      if (!params) throw `${cache.plugin.name} : Wrong result`
    }

    return params as Record<string, any>
  }

  const manualTrigger = async (id: string, event: PluginTriggerEvent, ...args: any[]) => {
    const plugin = getPluginById(id)
    if (!plugin) throw id + ' Not Found'
    const cache = PluginsCache[plugin.id]

    if (!cache) throw `${plugin.name} is Missing source code`
    if (cache.plugin.disabled) throw `${plugin.name} Disabled`

    const metadata = getPluginMetadata(plugin)
    const _args = args.map((arg) => JSON.stringify(arg))
    try {
      const fn = new window.AsyncFunction(
        `const Plugin = ${JSON.stringify(metadata)};
        ${cache.code};
        return await ${event}(${_args.join(',')})`
      )
      const exitCode = await fn()
      if (isNumber(exitCode) && exitCode !== plugin.status) {
        plugin.status = exitCode
        editPlugin(id, plugin)
      }
      return exitCode
    } catch (error: any) {
      throw `${cache.plugin.name} : ` + (error.message || error)
    }
  }

  const _watchDisabled = computed(() =>
    plugins.value
      .map((v) => v.disabled)
      .sort()
      .join()
  )

  const _watchMenus = computed(() =>
    plugins.value
      .map((v) => Object.entries(v.menus).map((v) => v[0] + v[1]))
      .sort()
      .join()
  )

  watch([_watchMenus, _watchDisabled], () => {
    updateTrayMenus()
  })

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
    onReadyTrigger: () => noParamsTrigger(PluginTrigger.OnReady),
    manualTrigger,
    updatePluginTrigger,
    getPluginCodefromCache,
    getPluginMetadata
  }
})
