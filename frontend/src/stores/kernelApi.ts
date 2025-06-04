import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { getProxies, getConfigs, setConfigs, Api } from '@/api/kernel'
import { ProcessInfo, KillProcess, ExecBackground, Readfile } from '@/bridge'
import { CoreConfigFilePath, CoreStopOutputKeyword, CoreWorkingDirectory } from '@/constant/kernel'
import { DefaultInboundMixed } from '@/constant/profile'
import { Inbound, TunStack } from '@/enums/kernel'
import {
  useAppSettingsStore,
  useProfilesStore,
  useLogsStore,
  useEnvStore,
  usePluginsStore,
} from '@/stores'
import {
  generateConfigFile,
  ignoredError,
  updateTrayMenus,
  getKernelFileName,
  restoreProfile,
  deepClone,
  WebSockets,
  setIntervalImmediately,
  message,
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
      stack: 'System',
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
      const txt = await Readfile(CoreConfigFilePath)
      runtimeProfile = restoreProfile(JSON.parse(txt))
      const profile = profilesStore.getProfileById(appSettingsStore.app.kernel.profile)
      if (profile) {
        const _profile = deepClone(profile)
        runtimeProfile.inbounds.forEach((inbound) => {
          const _in = _profile.inbounds.find((v) => v.tag === inbound.tag)
          if (_in) {
            inbound.id = _in.id
          }
        })
        const tunInbound = _profile.inbounds.find((v) => v.type === Inbound.Tun)
        if (tunInbound && !runtimeProfile.inbounds.find((v) => v.type === Inbound.Tun)) {
          tunInbound.enable = false
          runtimeProfile.inbounds.push(tunInbound)
        }
        runtimeProfile.id = _profile.id
        runtimeProfile.outbounds = _profile.outbounds
        runtimeProfile.dns = _profile.dns
        runtimeProfile.route = _profile.route
        runtimeProfile.mixin = _profile.mixin
        runtimeProfile.script = _profile.script
      }
    }

    const mixed = runtimeProfile.inbounds.find((v) => v.mixed)
    const http = runtimeProfile.inbounds.find((v) => v.http)
    const socks = runtimeProfile.inbounds.find((v) => v.socks)
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

    await restartKernel()
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
  const loading = ref(false)
  const statusLoading = ref(true)
  let isCoreStartedByThisInstance = false
  let doneFirstCoreUpdate: (value: unknown) => void
  const firstCoreUpdatePromise = new Promise((r) => (doneFirstCoreUpdate = r))

  const isKernelRunning = async (pid: number) => {
    return pid && (await ProcessInfo(pid)).startsWith('sing-box')
  }

  const updateKernelState = async () => {
    appSettingsStore.app.kernel.running = !!(await ignoredError(
      isKernelRunning,
      appSettingsStore.app.kernel.pid,
    ))

    if (!appSettingsStore.app.kernel.running) {
      appSettingsStore.app.kernel.pid = 0
    }

    statusLoading.value = false

    if (appSettingsStore.app.kernel.running) {
      await Promise.all([refreshConfig(), refreshProviderProxies()])
      await envStore.updateSystemProxyStatus()
    } else if (appSettingsStore.app.autoStartKernel) {
      await startKernel()
    }

    doneFirstCoreUpdate(null)
  }

  const onCoreStarted = async (pid: number) => {
    loading.value = false
    appSettingsStore.app.kernel.pid = pid
    appSettingsStore.app.kernel.running = true

    isCoreStartedByThisInstance = true
    await Promise.all([refreshConfig(), refreshProviderProxies()])

    if (appSettingsStore.app.autoSetSystemProxy) {
      await envStore.setSystemProxy().catch((err) => message.error(err))
    }
    await pluginsStore.onCoreStartedTrigger()
  }

  const onCoreStopped = async () => {
    loading.value = false
    appSettingsStore.app.kernel.pid = 0
    appSettingsStore.app.kernel.running = false

    if (appSettingsStore.app.autoSetSystemProxy) {
      await envStore.clearSystemProxy()
    }
    await pluginsStore.onCoreStoppedTrigger()
  }

  const startKernel = async (_profile?: IProfile) => {
    const { profile: profileID, branch } = appSettingsStore.app.kernel
    const profile = _profile || profilesStore.getProfileById(profileID)
    if (!profile) throw 'Choose a profile first'

    if (!_profile) {
      runtimeProfile = undefined
    }

    await stopKernel()

    const fileName = getKernelFileName(branch === 'alpha')
    const kernelFilePath = CoreWorkingDirectory + '/' + fileName
    const kernelWorkDir = envStore.env.basePath + '/' + CoreWorkingDirectory

    loading.value = true

    try {
      await generateConfigFile(profile, (config) =>
        pluginsStore.onBeforeCoreStartTrigger(config, profile),
      )
      const pid = await ExecBackground(
        kernelFilePath,
        ['run', '--disable-color', '-c', kernelWorkDir + '/config.json', '-D', kernelWorkDir],
        (out) => {
          logsStore.recordKernelLog(out)
          if (out.toLowerCase().includes(CoreStopOutputKeyword)) {
            onCoreStarted(pid)
          }
        },
        onCoreStopped,
        {
          stopOutputKeyword: CoreStopOutputKeyword,
        },
      )
    } catch (error) {
      loading.value = false
      throw error
    }
  }

  const stopKernel = async () => {
    const { pid } = appSettingsStore.app.kernel
    const running = await ignoredError(isKernelRunning, pid)
    if (running) {
      await pluginsStore.onBeforeCoreStopTrigger()
      await KillProcess(pid)
      if (!isCoreStartedByThisInstance) {
        await onCoreStopped()
      }
    }

    logsStore.clearKernelLog()
  }

  const restartKernel = async (cleanupTask?: () => Promise<any>, keepRuntimeProfile = true) => {
    await stopKernel()
    await cleanupTask?.()
    await startKernel(keepRuntimeProfile ? runtimeProfile : undefined)
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

  const _watchProxies = computed(() =>
    Object.values(proxies.value)
      .map((group) => group.name + group.now)
      .sort()
      .join(),
  )

  watch([() => config.value.mode, () => config.value.tun.enable, _watchProxies], updateTrayMenus)

  watch(
    () => appSettingsStore.app.kernel.running,
    async (v) => {
      await firstCoreUpdatePromise
      if (v) {
        initCoreWebsockets()
        longLivedWS.setup?.()
      } else {
        destroyCoreWebsockets()
      }
    },
  )

  return {
    startKernel,
    stopKernel,
    restartKernel,
    updateKernelState,
    loading,
    statusLoading,
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
