import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { getProxies, getConfigs, setConfigs, Api } from '@/api/kernel'
import { ProcessInfo, KillProcess, ExecBackground, ReadFile, WriteFile, RemoveFile } from '@/bridge'
import {
  CoreConfigFilePath,
  CorePidFilePath,
  CoreStopOutputKeyword,
  CoreWorkingDirectory,
} from '@/constant/kernel'
import { DefaultInboundMixed } from '@/constant/profile'
import { Branch } from '@/enums/app'
import { Inbound, RulesetType, TunStack } from '@/enums/kernel'
import {
  useAppSettingsStore,
  useProfilesStore,
  useLogsStore,
  useEnvStore,
  usePluginsStore,
  useSubscribesStore,
  useRulesetsStore,
} from '@/stores'
import {
  generateConfigFile,
  updateTrayMenus,
  getKernelFileName,
  restoreProfile,
  deepClone,
  WebSockets,
  setIntervalImmediately,
  message,
  getKernelRuntimeArgs,
  getKernelRuntimeEnv,
  eventBus,
} from '@/utils'

import type {
  CoreApiConfig,
  CoreApiProxy,
  CoreApiLogsData,
  CoreApiMemoryData,
  CoreApiTrafficData,
  CoreApiConnectionsData,
} from '@/types/kernel'

export type ProxyType = 'mixed' | 'http' | 'socks'

export const useKernelApiStore = defineStore('kernelApi', () => {
  const envStore = useEnvStore()
  const logsStore = useLogsStore()
  const pluginsStore = usePluginsStore()
  const profilesStore = useProfilesStore()
  const subscribesStore = useSubscribesStore()
  const rulesetsStore = useRulesetsStore()
  const appSettingsStore = useAppSettingsStore()

  /** RESTful API */
  const config = ref<CoreApiConfig>({
    port: 0,
    'mixed-port': 0,
    'socks-port': 0,
    'interface-name': '',
    'allow-lan': false,
    mode: '',
    tun: {
      enable: false,
      stack: '',
      device: '',
    },
  })

  let runtimeProfile: IProfile | undefined

  const proxies = ref<Record<string, CoreApiProxy>>({})

  const refreshConfig = async () => {
    const _config = await getConfigs()

    config.value = {
      ..._config,
      tun: config.value.tun,
    }

    if (!runtimeProfile) {
      const txt = await ReadFile(CoreConfigFilePath)
      runtimeProfile = restoreProfile(JSON.parse(txt))
      const profile = profilesStore.currentProfile
      if (profile) {
        const _profile = deepClone(profile)
        _profile.inbounds.forEach((inbound) => {
          const runtimeInbound = runtimeProfile?.inbounds.find((v) => v.tag === inbound.tag)
          if (runtimeInbound) {
            runtimeInbound.id = inbound.id
          } else {
            inbound.enable = false
            runtimeProfile?.inbounds.push(inbound)
          }
        })
        runtimeProfile.id = _profile.id
        runtimeProfile.outbounds = _profile.outbounds
        runtimeProfile.experimental = _profile.experimental
        runtimeProfile.dns = _profile.dns
        runtimeProfile.route = _profile.route
        runtimeProfile.mixin = _profile.mixin
        runtimeProfile.script = _profile.script
      }
    }

    const mixed = runtimeProfile.inbounds.find((v) => v.enable && v.mixed)
    const http = runtimeProfile.inbounds.find((v) => v.enable && v.http)
    const socks = runtimeProfile.inbounds.find((v) => v.enable && v.socks)
    const tun = runtimeProfile.inbounds.find((v) => v.tun)
    config.value['mixed-port'] = mixed?.mixed?.listen.listen_port || 0
    config.value['port'] = http?.http?.listen.listen_port || 0
    config.value['socks-port'] = socks?.socks?.listen.listen_port || 0
    config.value['allow-lan'] = [
      mixed?.mixed?.listen.listen,
      http?.http?.listen.listen,
      socks?.socks?.listen.listen,
    ].some((address) => address === '0.0.0.0' || address === '::')

    config.value.tun.enable = !!tun?.enable
    config.value.tun.device = tun?.tun?.interface_name || ''
    config.value.tun.stack = tun?.tun?.stack || ''
    config.value['interface-name'] = runtimeProfile.route.default_interface
  }

  const updateConfig = async (field: string, value: any) => {
    if (field === 'mode') {
      await setConfigs({ mode: value })
      await refreshConfig()
      return
    }

    const patchInbound = () => {
      if (!runtimeProfile) return
      const inbound = runtimeProfile.inbounds.find(
        (v) =>
          (v.type === Inbound.Mixed && v.mixed?.listen.listen_port) ||
          (v.type === Inbound.Http && v.http?.listen.listen_port) ||
          (v.type === Inbound.Socks && v.socks?.listen.listen_port),
      )
      if (!inbound) {
        throw 'home.overview.needPort'
      }
      inbound.enable = true
    }

    const patchInboundPort = (type: 'mixed' | 'socks' | 'http', port: number) => {
      if (!runtimeProfile) return
      let inbound = runtimeProfile.inbounds.find((v) => v.type === type)
      if (inbound) {
        inbound[type]!.listen.listen_port = port
      } else {
        const _type = DefaultInboundMixed()!
        _type.listen.listen_port = port
        inbound = {
          id: type + '-in',
          tag: type + '-in',
          type: type,
          enable: true,
          [type]: _type,
        }
        runtimeProfile.inbounds.push(inbound)
      }
      inbound.enable = port !== 0
    }

    const patchInboundAddress = (allowLan: boolean) => {
      if (!runtimeProfile) return
      runtimeProfile.inbounds.forEach((inbound) => {
        if (inbound.type === Inbound.Tun) return
        inbound[inbound.type]!.listen.listen = allowLan ? '0.0.0.0' : '127.0.0.1'
      })
    }

    const patchInboundTun = (options: {
      enable: boolean
      stack: string
      device: string
      interface_name: string
    }) => {
      if (!runtimeProfile) return
      const inbound = runtimeProfile.inbounds.find((v) => v.type === Inbound.Tun)
      if (!inbound) throw 'home.overview.needTun'
      options = { ...config.value.tun, ...options }
      inbound.enable = options.enable
      inbound.tun!.stack = options.stack || TunStack.Mixed
      inbound.tun!.interface_name = options.device || ''
      if (options.interface_name) {
        runtimeProfile.route.default_interface = options.interface_name
      }
      runtimeProfile.route.auto_detect_interface = !options.interface_name
    }

    const fieldHandlerMap: Recordable<() => void> = {
      inbound: () => patchInbound(),
      http: () => patchInboundPort(Inbound.Http, value),
      socks: () => patchInboundPort(Inbound.Socks, value),
      mixed: () => patchInboundPort(Inbound.Mixed, value),
      'allow-lan': () => patchInboundAddress(value),
      tun: () => patchInboundTun(value),
      'tun-stack': () => patchInboundTun(value),
      'tun-device': () => patchInboundTun(value),
      'interface-name': () => patchInboundTun(value),
    }

    fieldHandlerMap[field]?.()

    await restartCore(undefined, true)
    await envStore.updateSystemProxyStatus()
  }

  const refreshProviderProxies = async () => {
    const { proxies: b } = await getProxies()
    proxies.value = b
  }

  /* WebSocket */
  let websocketInstance: WebSockets | null
  const longLivedWS = {
    setup: undefined as (() => void) | undefined,
    cleanup: undefined as (() => void) | undefined,
    timer: -1,
  }
  const shortLivedWS = {
    setup: undefined as (() => void) | undefined,
    cleanup: undefined as (() => void) | undefined,
    timer: -1,
  }
  const onLogsEvents = {
    onFirst: undefined as (() => void) | undefined,
    onEmpty: undefined as (() => void) | undefined,
  }

  const websocketHandlers = {
    logs: [] as ((data: CoreApiLogsData) => void)[],
    memory: [] as ((data: CoreApiMemoryData) => void)[],
    traffic: [] as ((data: CoreApiTrafficData) => void)[],
    connections: [] as ((data: CoreApiConnectionsData) => void)[],
  } as const

  const createCoreWSHandlerRegister = <S extends C[], C>(
    source: S,
    events: { onFirst?: () => void; onEmpty?: () => void } = {},
  ) => {
    const register = (cb: S[number]) => {
      source.push(cb)
      source.length === 1 && events.onFirst?.()
      const unregister = () => {
        const idx = source.indexOf(cb)
        idx !== -1 && source.splice(idx, 1)
        source.length === 0 && events.onEmpty?.()
      }
      return unregister
    }
    return register
  }

  const createCoreWSDispatcher = <T>(source: ((data: T) => void)[]) => {
    return (data: T) => {
      source.forEach((cb) => cb(data))
    }
  }

  const initCoreWebsockets = () => {
    websocketInstance = new WebSockets({
      beforeConnect() {
        let base = 'ws://127.0.0.1:20123'
        let bearer = ''
        const profile = profilesStore.getProfileById(appSettingsStore.app.kernel.profile)
        if (profile) {
          const controller = profile.experimental.clash_api.external_controller || '127.0.0.1:20123'
          const [, port = 20123] = controller.split(':')
          base = `ws://127.0.0.1:${port}`
          bearer = profile.experimental.clash_api.secret
        }
        this.base = base
        this.bearer = bearer
      },
    })

    const { connect: connectLongLived, disconnect: disconnectLongLived } =
      websocketInstance.createWS([
        {
          name: 'Memory',
          url: Api.Memory,
          cb: createCoreWSDispatcher(websocketHandlers.memory),
        },
        {
          name: 'Traffic',
          url: Api.Traffic,
          cb: createCoreWSDispatcher(websocketHandlers.traffic),
        },
        {
          name: 'Connections',
          url: Api.Connections,
          cb: createCoreWSDispatcher(websocketHandlers.connections),
        },
      ])

    const { connect: connectShortLived, disconnect: disconnectShortLived } =
      websocketInstance.createWS([
        {
          name: 'Logs',
          url: Api.Logs,
          params: { level: 'debug' },
          cb: createCoreWSDispatcher(websocketHandlers.logs),
        },
      ])

    longLivedWS.setup = () => {
      longLivedWS.timer = setIntervalImmediately(connectLongLived, 3_000)
    }
    longLivedWS.cleanup = () => {
      clearInterval(longLivedWS.timer)
      disconnectLongLived()
      longLivedWS.cleanup = undefined
    }

    shortLivedWS.setup = () => {
      shortLivedWS.timer = setIntervalImmediately(connectShortLived, 3_000)
    }
    shortLivedWS.cleanup = () => {
      clearInterval(shortLivedWS.timer)
      disconnectShortLived()
      shortLivedWS.cleanup = undefined
    }

    onLogsEvents.onFirst = shortLivedWS.setup
    onLogsEvents.onEmpty = shortLivedWS.cleanup
  }

  const destroyCoreWebsockets = () => {
    longLivedWS.cleanup?.()
    shortLivedWS.cleanup?.()
    websocketInstance = null
  }

  /* Bridge API */
  const corePid = ref(-1)
  const running = ref(false)
  const starting = ref(false)
  const stopping = ref(false)
  const restarting = ref(false)
  const needRestart = ref(false)
  const coreStateLoading = ref(true)
  let isCoreStartedByThisInstance = false
  let { promise: coreStoppedPromise, resolve: coreStoppedResolver } = Promise.withResolvers()

  const initCoreState = async () => {
    corePid.value = Number(await ReadFile(CorePidFilePath).catch(() => -1))
    const processName = corePid.value === -1 ? '' : await ProcessInfo(corePid.value).catch(() => '')
    running.value = processName.startsWith('sing-box')

    coreStateLoading.value = false

    if (running.value) {
      initCoreWebsockets()
      longLivedWS.setup?.()
      await Promise.all([refreshConfig(), refreshProviderProxies()])
      await envStore.updateSystemProxyStatus()
    } else if (appSettingsStore.app.autoStartKernel) {
      await startCore()
    }
  }

  const runCoreProcess = (isAlpha: boolean) => {
    return new Promise<number | void>((resolve, reject) => {
      let output: string
      const pid = ExecBackground(
        CoreWorkingDirectory + '/' + getKernelFileName(isAlpha),
        getKernelRuntimeArgs(isAlpha),
        (out) => {
          output = out
          logsStore.recordKernelLog(out)
          if (out.includes(CoreStopOutputKeyword)) {
            resolve(pid)
          }
        },
        () => {
          onCoreStopped()
          reject(output)
        },
        { StopOutputKeyword: CoreStopOutputKeyword, Env: getKernelRuntimeEnv(isAlpha) },
      ).catch((e) => reject(e))
    })
  }

  const onCoreStarted = async (pid: number) => {
    await WriteFile(CorePidFilePath, String(pid))

    corePid.value = pid
    running.value = true
    needRestart.value = false
    isCoreStartedByThisInstance = true
    coreStoppedPromise = new Promise((r) => (coreStoppedResolver = r))

    initCoreWebsockets()
    longLivedWS.setup?.()
    await Promise.all([refreshConfig(), refreshProviderProxies()])

    if (appSettingsStore.app.autoSetSystemProxy) {
      await envStore.setSystemProxy().catch((err) => message.error(err))
    }
    await envStore.updateSystemProxyStatus()

    await pluginsStore.onCoreStartedTrigger()
  }

  const onCoreStopped = async () => {
    await RemoveFile(CorePidFilePath)

    corePid.value = -1
    running.value = false
    needRestart.value = false

    destroyCoreWebsockets()

    if (appSettingsStore.app.autoSetSystemProxy) {
      await envStore.clearSystemProxy()
    }
    await pluginsStore.onCoreStoppedTrigger()

    coreStoppedResolver(null)
  }

  const startCore = async (_profile?: IProfile) => {
    if (running.value) throw 'The core is already running'

    logsStore.clearKernelLog()

    const { profile: profileID, branch } = appSettingsStore.app.kernel
    const profile = _profile || profilesStore.getProfileById(profileID)
    if (!profile) throw 'Choose a profile first'

    if (!_profile) {
      runtimeProfile = undefined
    }

    starting.value = true
    try {
      await generateConfigFile(profile, (config) =>
        pluginsStore.onBeforeCoreStartTrigger(config, profile),
      )
      const isAlpha = branch === Branch.Alpha
      const pid = await runCoreProcess(isAlpha)
      pid && (await onCoreStarted(pid))
    } finally {
      starting.value = false
    }
  }

  const stopCore = async () => {
    if (!running.value) throw 'The core is not running'

    stopping.value = true
    try {
      await pluginsStore.onBeforeCoreStopTrigger()
      await KillProcess(corePid.value)
      await (isCoreStartedByThisInstance ? coreStoppedPromise : onCoreStopped())
    } finally {
      stopping.value = false
    }
  }

  const restartCore = async (cleanupTask?: () => Promise<any>, keepRuntimeProfile = false) => {
    restarting.value = true
    try {
      await stopCore()
      await cleanupTask?.()
      await startCore(keepRuntimeProfile ? runtimeProfile : undefined)
    } finally {
      needRestart.value = false
      restarting.value = false
    }
  }

  const getProxyPort = ():
    | {
        port: number
        proxyType: ProxyType
      }
    | undefined => {
    const { port, 'socks-port': socksPort, 'mixed-port': mixedPort } = config.value

    if (mixedPort) {
      return {
        port: mixedPort,
        proxyType: 'mixed',
      }
    }
    if (port) {
      return {
        port,
        proxyType: 'http',
      }
    }
    if (socksPort) {
      return {
        port: socksPort,
        proxyType: 'socks',
      }
    }
    return undefined
  }

  eventBus.on('profileChange', ({ id }) => {
    if (running.value && id === appSettingsStore.app.kernel.profile) {
      needRestart.value = true
    }
  })

  eventBus.on('subscriptionChange', ({ id }) => {
    if (running.value && profilesStore.currentProfile) {
      const inUse = profilesStore.currentProfile.outbounds.some(({ outbounds }) =>
        outbounds.some((outbound) => outbound.type === 'Subscription' && outbound.id === id),
      )
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  eventBus.on('subscriptionsChange', () => {
    if (running.value && profilesStore.currentProfile) {
      const enabledSubs = subscribesStore.subscribes.flatMap((v) => (v.disabled ? [] : v.id))
      const inUse = profilesStore.currentProfile.outbounds.some(({ outbounds }) =>
        outbounds.some(
          (outbound) => outbound.type === 'Subscription' && enabledSubs.includes(outbound.id),
        ),
      )
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  const collectRulesetIDs = () => {
    if (!profilesStore.currentProfile) return []
    const l1 = profilesStore.currentProfile.route.rule_set.flatMap((ruleset) =>
      ruleset.type === RulesetType.Local ? ruleset.path : [],
    )
    return l1
  }

  eventBus.on('rulesetChange', ({ id }) => {
    if (running.value && profilesStore.currentProfile) {
      const inUse = profilesStore.currentProfile.route.rule_set.some(
        (ruleset) => ruleset.type === RulesetType.Local && ruleset.path === id,
      )
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  eventBus.on('rulesetsChange', () => {
    if (running.value && profilesStore.currentProfile) {
      const enabledRulesets = rulesetsStore.rulesets.flatMap((v) => (v.disabled ? [] : v.id))
      const inUse = collectRulesetIDs().some((v) => enabledRulesets.includes(v))
      if (inUse) {
        needRestart.value = true
      }
    }
  })

  watch(needRestart, (v) => {
    if (v && appSettingsStore.app.autoRestartKernel) {
      restartCore()
    }
  })

  const watchSources = computed(() => {
    const source = [config.value.mode, config.value.tun.enable]
    if (!appSettingsStore.app.addGroupToMenu) return source.join('')

    const { unAvailable, sortByDelay } = appSettingsStore.app.kernel

    const proxySignature = Object.values(proxies.value)
      .map((group) => group.name + group.now)
      .sort()
      .join()

    return source.concat([proxySignature, unAvailable, sortByDelay]).join('')
  })

  watch([watchSources, running], updateTrayMenus)

  return {
    startCore,
    stopCore,
    restartCore,
    initCoreState,
    pid: corePid,
    running,
    starting,
    stopping,
    restarting,
    needRestart,
    coreStateLoading,
    config,
    proxies,
    refreshConfig,
    updateConfig,
    refreshProviderProxies,
    getProxyPort,

    onLogs: createCoreWSHandlerRegister(websocketHandlers.logs, onLogsEvents),
    onMemory: createCoreWSHandlerRegister(websocketHandlers.memory),
    onTraffic: createCoreWSHandlerRegister(websocketHandlers.traffic),
    onConnections: createCoreWSHandlerRegister(websocketHandlers.connections),
  }
})
