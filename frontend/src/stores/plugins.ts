import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { parse, stringify } from 'yaml'

import { HttpGet, ReadFile, RemoveFile, WriteFile } from '@/bridge'
import { PluginHubFilePath, PluginsFilePath } from '@/constant/app'
import { PluginTrigger, PluginTriggerEvent } from '@/enums/app'
import { useAppSettingsStore } from '@/stores'
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

import type { Plugin, Subscription, TrayContent, MenuItem } from '@/types/app'

const PluginsCache: Recordable<{ plugin: Plugin; code: string }> = {}

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
  [PluginTrigger.OnTrayUpdate]: {
    fnName: PluginTriggerEvent.OnTrayUpdate,
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
  [PluginTrigger.OnCoreStarted]: {
    fnName: PluginTriggerEvent.OnCoreStarted,
    observers: [],
  },
  [PluginTrigger.OnCoreStopped]: {
    fnName: PluginTriggerEvent.OnCoreStopped,
    observers: [],
  },
  [PluginTrigger.OnBeforeCoreStart]: {
    fnName: PluginTriggerEvent.OnBeforeCoreStart,
    observers: [],
  },
  [PluginTrigger.OnBeforeCoreStop]: {
    fnName: PluginTriggerEvent.OnBeforeCoreStop,
    observers: [],
  },
}

export const usePluginsStore = defineStore('plugins', () => {
  const appSettingsStore = useAppSettingsStore()

  const plugins = ref<Plugin[]>([])
  const pluginHub = ref<Plugin[]>([])

  const setupPlugins = async () => {
    const data = await ignoredError(ReadFile, PluginsFilePath)
    data && (plugins.value = parse(data))

    const list = await ignoredError(ReadFile, PluginHubFilePath)
    list && (pluginHub.value = JSON.parse(list))

    for (const plugin of plugins.value) {
      const { id, triggers, path, context, hasUI, tags } = plugin
      const code = await ignoredError(ReadFile, path)
      if (code) {
        PluginsCache[id] = { plugin, code }
        triggers.forEach((trigger) => {
          PluginsTriggerMap[trigger].observers.push(id)
        })
      }

      if (!context) {
        plugin.context = {
          profiles: {},
          subscriptions: {},
          rulesets: {},
          plugins: {},
          scheduledtasks: {},
        }
      }

      if (hasUI === undefined) {
        plugin.hasUI = false
      }

      if (tags === undefined) {
        plugin.tags = []
      }
    }

    pluginHub.value.forEach((plugin) => {
      if (plugin.tags === undefined) {
        plugin.tags = []
      }
    })
  }

  const getPluginMetadata = (plugin: Plugin) => {
    const configuration: Recordable = {}
    for (const { key, value } of plugin.configuration) {
      configuration[key] = value
    }
    Object.assign(configuration, appSettingsStore.app.pluginSettings[plugin.id] ?? {})
    return deepClone({ ...plugin, ...configuration })
  }

  const isPluginUnavailable = (
    cache: undefined | { plugin: Plugin; code: string },
  ): cache is undefined => {
    return (
      !cache ||
      !cache.plugin ||
      cache.plugin.disabled ||
      (cache.plugin.install && !cache.plugin.installed)
    )
  }

  const reloadPlugin = async (plugin: Plugin, code = '', reloadTrigger = false) => {
    const { path } = plugin
    if (!code) {
      code = await ReadFile(path)
    }
    PluginsCache[plugin.id] = { plugin, code }
    reloadTrigger && updatePluginTrigger(plugin)
  }

  // FIXME: Plug-in execution order is wrong
  const updatePluginTrigger = (plugin: Plugin, isUpdate = true) => {
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
    await WriteFile(PluginsFilePath, stringify(p))
  }, 100)

  const addPlugin = async (plugin: Plugin) => {
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
    const plugin = plugins.value.splice(idx, 1)[0]!
    try {
      await savePlugins()
      delete PluginsCache[id]
      updatePluginTrigger(plugin, false)
    } catch (error) {
      plugins.value.splice(idx, 0, plugin)
      throw error
    }
    plugin.path.startsWith('data') && RemoveFile(plugin.path)
    // Remove configuration
    if (appSettingsStore.app.pluginSettings[plugin.id]) {
      if (await confirm('Tips', 'plugins.removeConfiguration').catch(() => 0)) {
        delete appSettingsStore.app.pluginSettings[plugin.id]
      }
    }
  }

  const editPlugin = async (id: string, newPlugin: Plugin) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const plugin = plugins.value.splice(idx, 1, newPlugin)[0]!
    try {
      await savePlugins()
      updatePluginTrigger(newPlugin)
    } catch (error) {
      plugins.value.splice(idx, 1, plugin)
      throw error
    }
  }

  const _doUpdatePlugin = async (plugin: Plugin) => {
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
      code = await ReadFile(plugin.path).catch(() => '')
    }

    if (plugin.type === 'Http') {
      const { body } = await HttpGet(plugin.url)
      code = body
    }

    if (plugin.type !== 'File') {
      await WriteFile(plugin.path, code)
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

    const update = async (plugin: Plugin) => {
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
  const isDeprecated = (plugin: Plugin) => {
    if (!plugin.id.startsWith('plugin-')) return false
    return !findPluginInHubById(plugin.id)
  }
  const hasNewPluginVersion = (plugin: Plugin) => {
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
      await WriteFile(PluginHubFilePath, JSON.stringify(pluginHub.value))
    } finally {
      pluginHubLoading.value = false
    }
  }

  const getPluginById = (id: string) => plugins.value.find((v) => v.id === id)

  const getPluginCodefromCache = (id: string) => PluginsCache[id]?.code

  const onSubscribeTrigger = async (proxies: Recordable[], subscription: Subscription) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnSubscribe]
    if (observers.length === 0) return proxies

    subscription = deepClone(subscription)

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(
          'Plugin',
          'proxies',
          'subscription',
          `${cache.code}; return await ${fnName}(proxies, subscription)`,
        )
        proxies = await fn(metadata, proxies, subscription)
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }

      if (!Array.isArray(proxies)) {
        throw `${cache.plugin.name} : Wrong result`
      }
    }

    return proxies
  }

  const noParamsTrigger = async (trigger: PluginTrigger, interruptOnError = false) => {
    const { fnName, observers } = PluginsTriggerMap[trigger]
    if (observers.length === 0) return

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction('Plugin', `${cache.code}; return await ${fnName}()`)
        const exitCode = await fn(metadata)
        if (isNumber(exitCode) && exitCode !== cache.plugin.status) {
          cache.plugin.status = exitCode
          editPlugin(cache.plugin.id, cache.plugin)
        }
      } catch (error: any) {
        const msg = `${cache.plugin.name} : ` + (error.message || error)
        if (interruptOnError) {
          throw msg
        }
        console.error(msg)
      }
    }
  }

  const onGenerateTrigger = async (config: Recordable, profile: IProfile) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnGenerate]
    if (observers.length === 0) return config

    profile = deepClone(profile)

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(
          'Plugin',
          'config',
          'profile',
          `${cache.code}; return await ${fnName}(config, profile)`,
        )
        config = await fn(metadata, config, profile)
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }

      if (!config) throw `${cache.plugin.name} : Wrong result`
    }

    return config
  }

  const onBeforeCoreStartTrigger = async (params: Recordable, profile: IProfile) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnBeforeCoreStart]
    if (observers.length === 0) return params

    profile = deepClone(profile)

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(
          'Plugin',
          'config',
          'profile',
          `${cache.code}; return await ${fnName}(config, profile)`,
        )
        params = await fn(metadata, params, profile)
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }

      if (!params) throw `${cache.plugin.name} : Wrong result`
    }

    return params
  }

  const manualTrigger = async (id: string, event: PluginTriggerEvent, ...args: any[]) => {
    const plugin = getPluginById(id)
    if (!plugin) throw id + ' Not Found'
    const cache = PluginsCache[plugin.id]
    if (!cache) throw `${plugin.name} is Missing source code`
    if (cache.plugin.disabled) throw `${plugin.name} is Disabled`
    const metadata = getPluginMetadata(plugin)
    args = deepClone(args)
    try {
      const fn = new window.AsyncFunction(
        'Plugin',
        '...args',
        `${cache.code}; return await ${event}(...args)`,
      )

      const exitCode = await fn(metadata, ...args)
      if (isNumber(exitCode) && exitCode !== plugin.status) {
        plugin.status = exitCode
        editPlugin(id, plugin)
      }
      return exitCode
    } catch (error: any) {
      throw `${cache.plugin.name} : ` + (error.message || error)
    }
  }

  const onTrayUpdateTrigger = async (tray: TrayContent, menus: MenuItem[]) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnTrayUpdate]
    if (observers.length === 0) return [tray, menus] as const

    let finalTray = tray
    let finalMenus = menus
    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      const metadata = getPluginMetadata(cache.plugin)
      try {
        const fn = new window.AsyncFunction(
          'Plugin',
          'tray',
          'menus',
          `${cache.code}; return await ${fnName}(tray, menus)`,
        )
        const { tray, menus } = await fn(metadata, finalTray, finalMenus)
        finalTray = tray
        finalMenus = menus
      } catch (error: any) {
        throw `${cache.plugin.name} : ` + (error.message || error)
      }
    }

    return [finalTray, finalMenus] as const
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
    onTrayUpdateTrigger,
    onSubscribeTrigger,
    onGenerateTrigger,
    onStartupTrigger: () => noParamsTrigger(PluginTrigger.OnStartup),
    onShutdownTrigger: () => noParamsTrigger(PluginTrigger.OnShutdown, true),
    onReadyTrigger: () => noParamsTrigger(PluginTrigger.OnReady),
    onCoreStartedTrigger: () => noParamsTrigger(PluginTrigger.OnCoreStarted),
    onCoreStoppedTrigger: () => noParamsTrigger(PluginTrigger.OnCoreStopped),
    onBeforeCoreStopTrigger: () => noParamsTrigger(PluginTrigger.OnBeforeCoreStop, true),
    onBeforeCoreStartTrigger,
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
