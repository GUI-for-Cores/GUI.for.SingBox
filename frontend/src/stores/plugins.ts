import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'
import { computed, ref, watch } from 'vue'

import { PluginHubFilePath, PluginsFilePath } from '@/constant/app'
import { HttpGet, Readfile, Removefile, Writefile } from '@/bridge'
import { PluginTrigger, PluginTriggerEvent } from '@/enums/app'
import { useAppSettingsStore, type SubscribeType } from '@/stores'
import {
  debounce,
  ignoredError,
  updateTrayMenus,
  isNumber,
  omitArray,
  deepClone,
  confirm,
  asyncPool,
} from '@/utils'

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
  version: string
  name: string
  description: string
  type: 'Http' | 'File'
  url: string
  path: string
  triggers: PluginTrigger[]
  menus: Record<string, string>
  context: {
    profiles: Recordable
    subscriptions: Recordable
    rulesets: Recordable
    plugins: Recordable
    scheduledtasks: Recordable
  }
  configuration: PluginConfiguration[]
  disabled: boolean
  install: boolean
  installed: boolean
  status: number // 0: Normal 1: Running 2: Stopped
  // Not Config
  updating?: boolean
  loading?: boolean
  running?: boolean
}

const PluginsCache: Recordable<{ plugin: PluginType; code: string }> = {}

const PluginsTriggerMap: {
  [key in PluginTrigger]: {
    fnName: PluginTriggerEvent
    observers: string[]
  }
} = {
  [PluginTrigger.OnManual]: {
    fnName: PluginTriggerEvent.OnManual,
    observers: [],
  },
  [PluginTrigger.OnSubscribe]: {
    fnName: PluginTriggerEvent.OnSubscribe,
    observers: [],
  },
  [PluginTrigger.OnGenerate]: {
    fnName: PluginTriggerEvent.OnGenerate,
    observers: [],
  },
  [PluginTrigger.OnStartup]: {
    fnName: PluginTriggerEvent.OnStartup,
    observers: [],
  },
  [PluginTrigger.OnShutdown]: {
    fnName: PluginTriggerEvent.OnShutdown,
    observers: [],
  },
  [PluginTrigger.OnReady]: {
    fnName: PluginTriggerEvent.OnReady,
    observers: [],
  },
}

export const usePluginsStore = defineStore('plugins', () => {
  const appSettingsStore = useAppSettingsStore()

  const plugins = ref<PluginType[]>([])
  const pluginHub = ref<PluginType[]>([])

  const setupPlugins = async () => {
    const data = await ignoredError(Readfile, PluginsFilePath)
    data && (plugins.value = parse(data))

    const list = await ignoredError(Readfile, PluginHubFilePath)
    list && (pluginHub.value = JSON.parse(list))

    for (let i = 0; i < plugins.value.length; i++) {
      const { id, triggers, path, context } = plugins.value[i]
      const code = await ignoredError(Readfile, path)
      if (code) {
        PluginsCache[id] = { plugin: plugins.value[i], code }
        triggers.forEach((trigger) => {
          PluginsTriggerMap[trigger].observers.push(id)
        })
      }

      if (!context) {
        plugins.value[i].context = {
          profiles: {},
          subscriptions: {},
          rulesets: {},
          plugins: {},
          scheduledtasks: {},
        }
      }
    }
  }

  const getPluginMetadata = (plugin: PluginType) => {
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

  const reloadPlugin = async (plugin: PluginType, code = '', reloadTrigger = false) => {
    const { path } = plugin
    if (!code) {
      code = await Readfile(path)
    }
    PluginsCache[plugin.id] = { plugin, code }
    reloadTrigger && updatePluginTrigger(plugin)
  }

  // FIXME: Plug-in execution order is wrong
  const updatePluginTrigger = (plugin: PluginType, isUpdate = true) => {
    const triggers = Object.keys(PluginsTriggerMap) as PluginTrigger[]
    triggers.forEach((trigger) => {
      PluginsTriggerMap[trigger].observers = PluginsTriggerMap[trigger].observers.filter(
        (v) => v !== plugin.id,
      )
    })
    if (isUpdate) {
      plugin.triggers.forEach((trigger) => {
        PluginsTriggerMap[trigger].observers.push(plugin.id)
      })
    }
  }

  const savePlugins = debounce(async () => {
    const p = omitArray(plugins.value, ['updating', 'loading', 'running'])
    await Writefile(PluginsFilePath, stringify(p))
  }, 100)

  const addPlugin = async (plugin: PluginType) => {
    plugins.value.push(plugin)
    try {
      await _doUpdatePlugin(plugin)
      await savePlugins()
      updatePluginTrigger(plugin)
    } catch (error) {
      plugins.value.pop()
      throw error
    }
  }

  const deletePlugin = async (id: string) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const plugin = plugins.value.splice(idx, 1)[0]
    try {
      await savePlugins()
      delete PluginsCache[id]
      updatePluginTrigger(plugin, false)
    } catch (error) {
      plugins.value.splice(idx, 0, plugin)
      throw error
    }
    plugin.path.startsWith('data') && Removefile(plugin.path)
    // Remove configuration
    if (appSettingsStore.app.pluginSettings[plugin.id]) {
      if (await confirm('Tips', 'plugins.removeConfiguration').catch(() => 0)) {
        delete appSettingsStore.app.pluginSettings[plugin.id]
      }
    }
  }

  const editPlugin = async (id: string, newPlugin: PluginType) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const plugin = plugins.value.splice(idx, 1, newPlugin)[0]
    try {
      await savePlugins()
      updatePluginTrigger(newPlugin)
    } catch (error) {
      plugins.value.splice(idx, 1, plugin)
      throw error
    }
  }

  const _doUpdatePlugin = async (plugin: PluginType) => {
    const isFromPluginHub = plugin.id.startsWith('plugin-')
    if (isFromPluginHub) {
      const newPlugin = pluginHub.value.find((v) => v.id === plugin.id)
      if (!newPlugin) throw 'Plugin not found. Please update the Plugin-Hub.'

      const [major_now, minor_now, patch_now] = (plugin.version || '').substring(1).split('.')
      const [major_new, minor_new, patch_new] = (newPlugin.version || '').substring(1).split('.')

      if (major_now !== major_new) {
        await editPlugin(plugin.id, deepClone(newPlugin))
        const userSettigns = appSettingsStore.app.pluginSettings[plugin.id]
        if (userSettigns) {
          appSettingsStore.app.pluginSettings[plugin.id] = newPlugin.configuration.reduce(
            (p, c) => {
              const value_now = userSettigns[c.key]
              const value_new = c.value
              const type_now = Array.isArray(value_now) ? 'array' : typeof value_now
              const type_new = Array.isArray(value_new) ? 'array' : typeof value_new
              return {
                ...p,
                [c.key]: type_now === type_new ? value_now : value_new,
              }
            },
            {},
          )
        }
      } else if (minor_now !== minor_new || patch_now !== patch_new) {
        plugin.version = newPlugin.version
        await editPlugin(plugin.id, plugin)
      }
    }

    let code = ''

    if (plugin.type === 'File') {
      code = await Readfile(plugin.path).catch(() => '')
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
    const plugin = plugins.value.find((v) => v.id === id)
    if (!plugin) throw id + ' Not Found'
    if (plugin.disabled) throw plugin.name + ' is Disabled'
    try {
      plugin.updating = true
      await _doUpdatePlugin(plugin)
      return `Plugin [${plugin.name}] updated successfully.`
    } finally {
      plugin.updating = false
    }
  }

  const updatePlugins = async () => {
    let needSave = false

    const update = async (plugin: PluginType) => {
      try {
        plugin.updating = true
        await _doUpdatePlugin(plugin)
        needSave = true
      } finally {
        plugin.updating = false
      }
    }

    await asyncPool(
      5,
      plugins.value.filter((v) => !v.disabled),
      update,
    )

    if (needSave) savePlugins()
  }

  const pluginHubLoading = ref(false)
  const findPluginInHubById = (id: string) => pluginHub.value.find((v) => v.id === id)
  const isDeprecated = (plugin: PluginType) => {
    if (!plugin.id.startsWith('plugin-')) return false
    return !findPluginInHubById(plugin.id)
  }
  const hasNewPluginVersion = (plugin: PluginType) => {
    const p = findPluginInHubById(plugin.id)
    if (!p) return false
    return p.version !== plugin.version
  }
  const updatePluginHub = async () => {
    pluginHubLoading.value = true
    try {
      const { body: body1 } = await HttpGet<string>(
        'https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/generic.json',
      )
      const { body: body2 } = await HttpGet<string>(
        'https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/gfs.json',
      )
      pluginHub.value = [...JSON.parse(body1), ...JSON.parse(body2)]
      await Writefile(PluginHubFilePath, JSON.stringify(pluginHub.value))
    } finally {
      pluginHubLoading.value = false
    }
  }

  const getPluginById = (id: string) => plugins.value.find((v) => v.id === id)

  const getPluginCodefromCache = (id: string) => PluginsCache[id]?.code

  const onSubscribeTrigger = async (
    proxies: Record<string, any>[],
    subscription: SubscribeType,
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
          `const Plugin = ${JSON.stringify(metadata)}; ${cache.code}; return await ${fnName}()`,
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
          `const Plugin = ${JSON.stringify(metadata)}; ${cache.code}; return await ${fnName}(${JSON.stringify(params)}, ${JSON.stringify(profile)})`,
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
    if (cache.plugin.disabled) throw `${plugin.name} is Disabled`

    const metadata = getPluginMetadata(plugin)
    const _args = args.map((arg) => JSON.stringify(arg))
    try {
      const fn = new window.AsyncFunction(
        `const Plugin = ${JSON.stringify(metadata)};
        ${cache.code};
        return await ${event}(${_args.join(',')})`,
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
      .join(),
  )

  const _watchMenus = computed(() =>
    plugins.value
      .map((v) => Object.entries(v.menus).map((v) => v[0] + v[1]))
      .sort()
      .join(),
  )

  watch([_watchMenus, _watchDisabled], () => {
    if (appSettingsStore.app.addPluginToMenu) {
      updateTrayMenus()
    }
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
    getPluginMetadata,

    pluginHub,
    pluginHubLoading,
    updatePluginHub,
    hasNewPluginVersion,
    findPluginInHubById,
    isDeprecated,
  }
})
