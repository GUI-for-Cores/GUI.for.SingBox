import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { parse } from 'yaml'

import { HttpGet, ReadFile, RemoveFile, Requests, WriteFile } from '@/bridge'
import { PluginHubFilePath, PluginsFilePath } from '@/constant/app'
import { PluginTrigger, PluginTriggerEvent, RequestMethod } from '@/enums/app'
import { useAppSettingsStore } from '@/stores'
import {
  ignoredError,
  updateTrayAndMenus,
  isNumber,
  omitArray,
  deepClone,
  confirm,
  asyncPool,
  stringifyNoFolding,
  readonly,
  base64Encode,
} from '@/utils'

import type { Plugin, Subscription, TrayContent, MenuItem } from '@/types/app'

type PluginRuntimeCache = {
  plugin: Plugin
  code?: string
  module?: {
    url: string
    moduleDefault?: Recordable
    modulePromise: Promise<
      {
        default?: MaybePromise<
          (Plugin: Plugin) => Partial<Record<PluginTriggerEvent, (...args: any[]) => any>>
        >
      } & {
        [k in PluginTriggerEvent]: MaybePromise<(...args: any[]) => any>
      }
    >
  }
}

const PluginsCache: Recordable<PluginRuntimeCache> = {}

const PluginsTriggerMap: Partial<
  Record<
    PluginTrigger,
    {
      fnName: PluginTriggerEvent
      observers: string[]
    }
  >
> = {
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
  [PluginTrigger.OnReload]: {
    fnName: PluginTriggerEvent.OnReload,
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
      upsertPluginCache(plugin)
      syncPluginObservers(plugin, !plugin.disabled)
    }
  }

  const upsertPluginCache = (plugin: Plugin, code?: string) => {
    const oldCache = PluginsCache[plugin.id]
    PluginsCache[plugin.id] =
      code === undefined
        ? { ...oldCache, plugin: deepClone(plugin) }
        : { plugin: deepClone(plugin), code }
    return PluginsCache[plugin.id]!
  }

  const shouldResetPluginModule = (oldPlugin: Plugin, newPlugin: Plugin) => {
    return (
      oldPlugin.path !== newPlugin.path ||
      oldPlugin.disabled !== newPlugin.disabled ||
      oldPlugin.triggers.join('|') !== newPlugin.triggers.join('|') ||
      JSON.stringify(oldPlugin.menus) !== JSON.stringify(newPlugin.menus) ||
      JSON.stringify(oldPlugin.context) !== JSON.stringify(newPlugin.context)
    )
  }

  const syncPluginObservers = (plugin: Plugin, enabled = true) => {
    const triggers = Object.keys(PluginsTriggerMap) as PluginTrigger[]
    const activePluginMap = new Map(
      plugins.value.flatMap((item) =>
        item.id !== plugin.id && !item.disabled ? [[item.id, item] as const] : [],
      ),
    )

    enabled && activePluginMap.set(plugin.id, plugin)

    triggers.forEach((trigger) => {
      PluginsTriggerMap[trigger]!.observers = plugins.value.flatMap((item) =>
        activePluginMap.has(item.id) && activePluginMap.get(item.id)!.triggers.includes(trigger)
          ? [item.id]
          : [],
      )
    })
  }

  const createPluginSourceMapComment = (
    plugin: Plugin,
    originalCode: string,
    prependedLineCount = 0,
    appendedLineCount = 0,
  ) => {
    const createLineOnlySourceMapMappings = (
      mappedLineCount: number,
      prependedUnmappedLineCount = 0,
      appendedUnmappedLineCount = 0,
    ) => {
      const mappedLines = Array.from({ length: mappedLineCount }, (_, index) =>
        index === 0 ? 'AAAA' : 'AACA',
      )
      const prependedUnmappedLines = Array.from({ length: prependedUnmappedLineCount }, () => '')
      const appendedUnmappedLines = Array.from({ length: appendedUnmappedLineCount }, () => '')
      return [...prependedUnmappedLines, ...mappedLines, ...appendedUnmappedLines].join(';')
    }

    const sourceMap = {
      version: 3,
      file: plugin.path,
      sources: [plugin.path],
      sourcesContent: [originalCode],
      names: [],
      mappings: createLineOnlySourceMapMappings(
        originalCode.split('\n').length,
        prependedLineCount,
        appendedLineCount,
      ),
    }

    return `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Encode(JSON.stringify(sourceMap))}`
  }

  const resetPluginModuleCache = (id: string) => {
    const cache = PluginsCache[id]
    if (cache?.module) {
      URL.revokeObjectURL(cache.module.url)
      delete cache.module
    }
  }

  const releasePluginRuntimeCache = (id: string) => {
    resetPluginModuleCache(id)
    delete (globalThis as any).__GUI_FOR_CORES_PLUGIN_CONTEXT__?.[id]
    delete PluginsCache[id]
  }

  const ensurePluginRuntimeCache = (plugin: Plugin) => {
    if (!PluginsCache[plugin.id]) {
      upsertPluginCache(plugin)
    }
  }

  const disposePluginInstance = async (id: string) => {
    if (!PluginsCache[id]?.module) return
    await runPluginEvent(id, PluginTriggerEvent.OnDispose, [], {
      allowDisabled: true,
      allowUndefined: true,
    })
  }

  const loadPluginModule = async (id: string) => {
    const cache = PluginsCache[id]
    if (!cache) throw new Error(`${id} Not Found`)
    if (cache.module) {
      return cache.module.modulePromise
    }
    if (cache.code === undefined) {
      cache.code = await ReadFile(cache.plugin.path).catch((error) => {
        if (cache.plugin.type === 'File') {
          return ''
        }
        throw error
      })
    }

    const events = new Set<PluginTriggerEvent | string>([
      PluginTriggerEvent.OnEnabled,
      PluginTriggerEvent.OnDisabled,
      PluginTriggerEvent.OnDispose,
      PluginTriggerEvent.OnConfigure,
      PluginTriggerEvent.OnTask,
      PluginTriggerEvent.OnInstall,
      PluginTriggerEvent.OnUninstall,
    ])

    for (const trigger of cache.plugin.triggers) {
      const event = PluginsTriggerMap[trigger]?.fnName
      event && events.add(event)
    }

    Object.values(cache.plugin.menus).forEach((fn) => {
      events.add(fn)
    })
    Object.values(cache.plugin.context).forEach((ctx) => {
      Object.values(ctx).forEach((fn) => {
        events.add(fn)
      })
    })

    const eventsStr = [...events].join('|')
    ;(globalThis as any).__GUI_FOR_CORES_PLUGIN_CONTEXT__ ||= {}
    ;(globalThis as any).__GUI_FOR_CORES_PLUGIN_CONTEXT__[id] = getPluginMetadata(id)

    const code = cache.code
      .replace(new RegExp(`^const\\s+(${eventsStr})`, 'gm'), 'export const $1')
      .replace(new RegExp(`^function\\s+(${eventsStr})`, 'gm'), 'export function $1')
      .replace(new RegExp(`^async\\s+function\\s+(${eventsStr})`, 'gm'), 'export async function $1')

    const sourceMapComment = createPluginSourceMapComment(cache.plugin, code, 1, 0)
    const source = [
      `const Plugin = globalThis.__GUI_FOR_CORES_PLUGIN_CONTEXT__?.[${JSON.stringify(id)}]`,
      code,
      sourceMapComment,
    ].join('\n')
    const blob = new Blob([source], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const modulePromise = import(/* @vite-ignore */ url)
      .then((module) => {
        delete (globalThis as any).__GUI_FOR_CORES_PLUGIN_CONTEXT__?.[id]
        return module
      })
      .catch((error) => {
        delete (globalThis as any).__GUI_FOR_CORES_PLUGIN_CONTEXT__?.[id]
        resetPluginModuleCache(id)
        throw error
      }) as Required<PluginRuntimeCache>['module']['modulePromise']

    cache.module = { url, modulePromise }
    return modulePromise
  }

  const runPluginEvent = async (
    id: string,
    event: PluginTriggerEvent,
    args: any[] = [],
    options?: { allowDisabled?: boolean; allowUndefined?: boolean },
  ) => {
    const cache = PluginsCache[id]
    if (!cache) throw `${id} Not Found`
    const pluginName = cache.plugin.name
    if (cache.plugin.disabled && !options?.allowDisabled) {
      throw `${cache.plugin.name} is Disabled`
    }

    try {
      const module = await loadPluginModule(id)
      if (!cache.module?.moduleDefault) {
        if (typeof module.default === 'function') {
          cache.module!.moduleDefault = await module.default(getPluginMetadata(id))
        } else {
          cache.module!.moduleDefault = module.default
        }
      }
      const defaultHandler = cache.module?.moduleDefault?.[event]
      const moduleHandler = module[event]
      if (typeof defaultHandler === 'function' && typeof moduleHandler === 'function') {
        console.warn(
          `[${cache.plugin.name}] ${event} is defined in both default export and named export. Using default export.`,
        )
      }
      const handler = defaultHandler || moduleHandler
      if (typeof handler !== 'function') {
        if (options?.allowUndefined) return
        throw new Error(`${event} is not defined`)
      }
      return await handler(...args)
    } catch (error: any) {
      throw `${pluginName} : ` + (error.message || error)
    }
  }

  const getPluginMetadata = (id: string) => {
    const lastConfiguration: Recordable = { time: 0, data: undefined }
    const buildConfiguration = (plugin: Plugin) => {
      const now = performance.now()
      if (lastConfiguration.data && now - lastConfiguration.time < 1000) {
        return lastConfiguration.data
      }

      const configuration: Recordable = {}
      for (const { key, value } of plugin.configuration) {
        configuration[key] = value
      }

      const userSettings = appSettingsStore.app.pluginSettings[plugin.id]
      if (userSettings) {
        for (const key in userSettings) {
          configuration[key] = userSettings[key]
        }
      }

      lastConfiguration.time = now
      lastConfiguration.data = configuration
      return configuration
    }

    const lastPlugin: { time: number; data: Plugin | undefined } = { time: 0, data: undefined }
    const getPlugin = () => {
      const now = performance.now()
      if (lastPlugin.data && now - lastPlugin.time < 1000) {
        return lastPlugin.data
      }
      const cache = PluginsCache[id]
      const plugin = cache?.plugin || plugins.value.find((item) => item.id === id)
      if (!plugin) throw new Error()

      lastPlugin.time = now
      lastPlugin.data = plugin
      return plugin
    }

    const proxy = new Proxy({} as Plugin & Recordable, {
      get(_, p) {
        const plugin = getPlugin()
        if (typeof p === 'string' && p.startsWith('__v_')) {
          return Reflect.get(plugin, p)
        }

        let value
        if (Object.hasOwn(plugin, p)) {
          value = Reflect.get(plugin, p)
        } else {
          const configuration = buildConfiguration(plugin)
          value = Reflect.get(configuration, p)
        }

        if (p === 'status') return value

        return readonly(value)
      },

      set(_, p, newValue) {
        const plugin = getPlugin()

        if (p === 'status') {
          plugin.status = newValue
          updatePluginState(plugin.id, plugin)
          return true
        }

        console.warn(`[${plugin.name}] Property "${String(p)}" is read-only.`)
        return false
      },

      ownKeys() {
        const plugin = getPlugin()
        const configuration = buildConfiguration(plugin)
        return [...Reflect.ownKeys(plugin), ...Reflect.ownKeys(configuration)]
      },

      getOwnPropertyDescriptor() {
        return {
          enumerable: true,
          configurable: true,
        }
      },
    })

    return proxy
  }

  const isPluginUnavailable = (cache: undefined | PluginRuntimeCache): cache is undefined => {
    return !cache || !cache.plugin || cache.plugin.disabled
  }

  const reloadPlugin = async (plugin: Plugin, code = '', reloadTrigger = false) => {
    const { path } = plugin
    if (!code) {
      code = await ReadFile(path)
    }
    await disposePluginInstance(plugin.id)
    upsertPluginCache(plugin, code)
    resetPluginModuleCache(plugin.id)
    if (reloadTrigger) {
      syncPluginObservers(plugin, !plugin.disabled)
    }
  }

  const savePlugins = () => {
    const p = omitArray(plugins.value, ['updating', 'loading', 'running'])
    return WriteFile(PluginsFilePath, stringifyNoFolding(p))
  }

  const addPlugin = async (plugin: Plugin) => {
    plugins.value.push(plugin)
    upsertPluginCache(plugin)
    syncPluginObservers(plugin, !plugin.disabled)
    await _doUpdatePlugin(plugin).catch(() => {})
    await runPluginEvent(plugin.id, PluginTriggerEvent.OnInstall, [], {
      allowDisabled: true,
      allowUndefined: true,
    })
    await savePlugins()
  }

  const deletePlugin = async (id: string) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const plugin = plugins.value[idx]!

    ensurePluginRuntimeCache(plugin)

    if (!plugin.disabled) {
      await runPluginEvent(id, PluginTriggerEvent.OnDisabled, [], {
        allowDisabled: true,
        allowUndefined: true,
      })
    }

    await disposePluginInstance(id)
    await runPluginEvent(id, PluginTriggerEvent.OnUninstall, [], {
      allowDisabled: true,
      allowUndefined: true,
    })

    plugins.value.splice(idx, 1)

    syncPluginObservers(plugin, false)
    releasePluginRuntimeCache(id)

    if (plugin.path.startsWith('data')) {
      await RemoveFile(plugin.path).catch((_) => {})
    }
    if (appSettingsStore.app.pluginSettings[plugin.id]) {
      if (await confirm('Tips', 'plugins.removeConfiguration').catch(() => 0)) {
        delete appSettingsStore.app.pluginSettings[plugin.id]
      }
    }

    await savePlugins()
  }

  const editPlugin = async (id: string, newPlugin: Plugin) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const plugin = plugins.value[idx]!
    const oldPlugin = deepClone(PluginsCache[id]?.plugin || plugin)
    const shouldResetModule = shouldResetPluginModule(oldPlugin, newPlugin)
    const shouldEnable = oldPlugin.disabled && !newPlugin.disabled
    const shouldDisable = !oldPlugin.disabled && newPlugin.disabled

    if (shouldDisable) {
      await runPluginEvent(id, PluginTriggerEvent.OnDisabled, [], {
        allowDisabled: true,
        allowUndefined: true,
      })
      await disposePluginInstance(id)
    }

    plugins.value.splice(idx, 1, newPlugin)
    syncPluginObservers(newPlugin, !newPlugin.disabled)

    if (shouldDisable) {
      releasePluginRuntimeCache(id)
    } else {
      if (shouldResetModule) {
        await disposePluginInstance(id)
      }
      upsertPluginCache(newPlugin)
      if (shouldResetModule) {
        resetPluginModuleCache(id)
      }
    }

    if (shouldEnable) {
      upsertPluginCache(newPlugin)
      await runPluginEvent(newPlugin.id, PluginTriggerEvent.OnEnabled, [], {
        allowDisabled: true,
        allowUndefined: true,
      })
    }

    await savePlugins()
  }

  const updatePluginState = async (id: string, newPlugin: Plugin) => {
    const idx = plugins.value.findIndex((v) => v.id === id)
    if (idx === -1) return

    plugins.value.splice(idx, 1, newPlugin)
    syncPluginObservers(newPlugin, !newPlugin.disabled)
    if (PluginsCache[id]) {
      upsertPluginCache(newPlugin)
    }
    await savePlugins()
  }

  const _doUpdatePlugin = async (plugin: Plugin) => {
    let nextPlugin = plugin
    const isFromPluginHub = plugin.id.startsWith('plugin-')
    if (isFromPluginHub) {
      const newPlugin = pluginHub.value.find((v) => v.id === plugin.id)
      if (!newPlugin) throw 'Plugin not found. Please update the Plugin-Hub.'

      const [major_now, minor_now, patch_now] = (plugin.version || '').substring(1).split('.')
      const [major_new, minor_new, patch_new] = (newPlugin.version || '').substring(1).split('.')

      if (major_now !== major_new) {
        newPlugin.updating = plugin.updating
        newPlugin.loading = plugin.loading
        newPlugin.running = plugin.running
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
        nextPlugin = newPlugin
      } else if (minor_now !== minor_new || patch_now !== patch_new) {
        plugin.version = newPlugin.version
        await editPlugin(plugin.id, plugin)
      }
    }

    let code = ''

    if (nextPlugin.type === 'File') {
      code = await ReadFile(nextPlugin.path).catch(() => '')
    }

    if (nextPlugin.type === 'Http') {
      const { status, body } = await HttpGet(nextPlugin.url)
      if (status !== 200) {
        throw new Error(`Failed to fetch plugin code from ${nextPlugin.url}. Status: ${status}`)
      }
      code = body
    }

    if (nextPlugin.type !== 'File') {
      await WriteFile(nextPlugin.path, code)
    }

    await disposePluginInstance(nextPlugin.id)
    upsertPluginCache(nextPlugin, code)
    syncPluginObservers(nextPlugin, !nextPlugin.disabled)
    resetPluginModuleCache(nextPlugin.id)
  }

  const updatePlugin = async (id: string) => {
    const plugin = plugins.value.find((v) => v.id === id)
    if (!plugin) throw id + ' Not Found'
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
      const result = { ok: true, id: plugin.id, name: plugin.name, result: '' }
      try {
        plugin.updating = true
        await _doUpdatePlugin(plugin)
        needSave = true
        result.result = `Plugin [${plugin.name}] updated successfully.`
      } catch (error: any) {
        result.ok = false
        result.result = `Failed to update plugin [${plugin.name}]. Reason: ${error.message || error}`
      } finally {
        plugin.updating = false
      }
      return result
    }

    const result = await asyncPool(5, plugins.value, update)

    if (needSave) await savePlugins()

    return result.flatMap((v) => (v.ok && v.value) || [])
  }

  const pluginHubLoading = ref(false)
  const findPluginInHubById = (id: string) => pluginHub.value.find((v) => v.id === id)
  const isDeprecated = (plugin: Plugin) => {
    if (!plugin.id.startsWith('plugin-')) return false
    return !findPluginInHubById(plugin.id)
  }
  const isDevVersion = (plugin: Plugin) => {
    return plugin.version.startsWith('v0')
  }
  const hasNewPluginVersion = (plugin: Plugin) => {
    const p = findPluginInHubById(plugin.id)
    if (!p) return false
    return p.version !== plugin.version
  }
  const updatePluginHub = async () => {
    pluginHubLoading.value = true
    const promises = appSettingsStore.app.plugins.sources.flatMap((source) => {
      if (!source.enable) return []
      return Requests<string>({
        url: source.url,
        method: RequestMethod.Get,
        autoTransformBody: false,
      })
    })
    const results = await Promise.allSettled(promises)

    pluginHub.value = results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        try {
          const plugins = JSON.parse(result.value.body) as Plugin[]
          acc.push(...plugins)
        } catch (error) {
          console.error('Failed to parse plugin list from source. Reason: ', error)
        }
      }
      return acc
    }, [] as Plugin[])

    await WriteFile(PluginHubFilePath, JSON.stringify(pluginHub.value))
    pluginHubLoading.value = false
  }

  const getPluginById = (id: string) => plugins.value.find((v) => v.id === id)

  const getPluginCodefromCache = (id: string) => PluginsCache[id]?.code

  const onSubscribeTrigger = async (proxies: Recordable[], subscription: Subscription) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnSubscribe]!
    if (observers.length === 0) return proxies

    subscription = deepClone(subscription)

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      proxies = await runPluginEvent(observer, fnName, [proxies, subscription])

      if (!Array.isArray(proxies)) {
        throw `${cache.plugin.name} : Wrong result`
      }
    }

    return proxies
  }

  const noParamsTrigger = async (trigger: PluginTrigger, interruptOnError = false) => {
    const config = PluginsTriggerMap[trigger]
    if (!config) return
    const { fnName, observers } = config
    if (observers.length === 0) return

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      try {
        const exitCode = await runPluginEvent(observer, fnName)
        if (isNumber(exitCode) && exitCode !== cache.plugin.status) {
          cache.plugin.status = exitCode
          await updatePluginState(cache.plugin.id, cache.plugin)
        }
      } catch (error: any) {
        const msg = error.message || error
        if (interruptOnError) {
          throw msg
        }
        console.error(msg)
      }
    }
  }

  const onGenerateTrigger = async (config: Recordable, profile: IProfile) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnGenerate]!
    if (observers.length === 0) return config

    profile = deepClone(profile)

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      config = await runPluginEvent(observer, fnName, [config, profile])

      if (!config) throw `${cache.plugin.name} : Wrong result`
    }

    return config
  }

  const onBeforeCoreStartTrigger = async (params: Recordable, profile: IProfile) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnBeforeCoreStart]!
    if (observers.length === 0) return params

    profile = deepClone(profile)

    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      params = await runPluginEvent(observer, fnName, [params, profile])

      if (!params) throw `${cache.plugin.name} : Wrong result`
    }

    return params
  }

  const manualTrigger = async (id: string, event: PluginTriggerEvent, ...args: any[]) => {
    const plugin = getPluginById(id)
    if (!plugin) throw id + ' Not Found'
    if (!PluginsCache[id]) {
      upsertPluginCache(plugin)
    }
    if (plugin.disabled) {
      throw `${plugin.name} is Disabled`
    }
    args = deepClone(args)
    const exitCode = await runPluginEvent(id, event, args)
    if (isNumber(exitCode) && exitCode !== plugin.status) {
      plugin.status = exitCode
      editPlugin(id, plugin)
    }
    return exitCode
  }

  const onTrayUpdateTrigger = async (tray: TrayContent, menus: MenuItem[]) => {
    const { fnName, observers } = PluginsTriggerMap[PluginTrigger.OnTrayUpdate]!
    if (observers.length === 0) return [tray, menus] as const

    let finalTray = tray
    let finalMenus = menus
    for (const observer of observers) {
      const cache = PluginsCache[observer]

      if (isPluginUnavailable(cache)) continue

      const { tray, menus } = await runPluginEvent(observer, fnName, [finalTray, finalMenus])
      finalTray = tray
      finalMenus = menus
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
      updateTrayAndMenus()
    }
  })

  return {
    plugins,
    setupPlugins,
    savePlugins,
    addPlugin,
    editPlugin,
    updatePluginState,
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
    onReloadTrigger: () => noParamsTrigger(PluginTrigger.OnReload, true),
    onCoreStartedTrigger: () => noParamsTrigger(PluginTrigger.OnCoreStarted),
    onCoreStoppedTrigger: () => noParamsTrigger(PluginTrigger.OnCoreStopped),
    onBeforeCoreStopTrigger: () => noParamsTrigger(PluginTrigger.OnBeforeCoreStop, true),
    onBeforeCoreStartTrigger,
    manualTrigger,
    getPluginCodefromCache,
    getPluginMetadata,

    pluginHub,
    pluginHubLoading,
    updatePluginHub,
    hasNewPluginVersion,
    findPluginInHubById,
    isDeprecated,
    isDevVersion,
  }
})
