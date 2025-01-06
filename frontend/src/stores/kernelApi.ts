import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { DefaultInboundMixed, DefaultInboundTun } from '@/constant/profile'
import { ProcessInfo, KillProcess, ExecBackground, Readfile } from '@/bridge'
import { CoreConfigFilePath, CoreWorkingDirectory } from '@/constant/kernel'
import { getProxies, getProviders, getConfigs, setConfigs } from '@/api/kernel'
import { useAppSettingsStore, useProfilesStore, useLogsStore, useEnvStore } from '@/stores'
import {
  generateConfigFile,
  ignoredError,
  updateTrayMenus,
  getKernelFileName,
  restoreProfile,
  deepClone,
} from '@/utils'
import { Inbound, TunStack } from '@/enums/kernel'

export type ProxyType = 'mixed' | 'http' | 'socks'

export const useKernelApiStore = defineStore('kernelApi', () => {
  const envStore = useEnvStore()
  const logsStore = useLogsStore()
  const profilesStore = useProfilesStore()
  const appSettingsStore = useAppSettingsStore()

  /** RESTful API */
  const config = ref<IKernelApiConfig>({
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

  const proxies = ref<Record<string, IKernelProxy>>({})
  const providers = ref<{
    [key: string]: {
      name: string
      proxies: IKernelProxy[]
    }
  }>({})

  const refreshConfig = async () => {
    const _config = await getConfigs()

    config.value = {
      ..._config,
      tun: config.value.tun,
    }

    if (!runtimeProfile) {
      const txt = await Readfile(CoreConfigFilePath)
      runtimeProfile = restoreProfile(JSON.parse(txt))
    }

    const profile = profilesStore.getProfileById(appSettingsStore.app.kernel.profile)
    if (profile) {
      const _profile = deepClone(profile)
      runtimeProfile.inbounds.forEach((inbound) => {
        const _in = _profile.inbounds.find((v) => v.tag === inbound.tag)
        if (_in) {
          inbound.id = _in.id
        }
      })
      runtimeProfile.outbounds = _profile.outbounds
      runtimeProfile.dns = _profile.dns
      runtimeProfile.route.final = _profile.route.final
      runtimeProfile.route.rule_set = _profile.route.rule_set
      runtimeProfile.route.rules = _profile.route.rules
      runtimeProfile.mixin = _profile.mixin
      runtimeProfile.script = _profile.script
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
      options = { ...config.value.tun, ...options }
      let inbound = runtimeProfile.inbounds.find((v) => v.type === Inbound.Tun)
      if (!inbound) {
        inbound = {
          id: 'tun-in',
          tag: 'tun-in',
          type: Inbound.Tun,
          enable: false,
          tun: DefaultInboundTun(),
        }
        runtimeProfile.inbounds.push(inbound)
      }
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
    const [{ providers: a }, { proxies: b }] = await Promise.all([getProviders(), getProxies()])
    providers.value = a
    proxies.value = b
  }

  /* Bridge API */
  const loading = ref(false)
  const statusLoading = ref(true)

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
      await refreshConfig()
      await refreshProviderProxies()
      await envStore.updateSystemProxyStatus()
    } else if (appSettingsStore.app.autoStartKernel) {
      await startKernel()
    }
  }

  const startKernel = async (_profile?: IProfile) => {
    const { profile: profileID, branch } = appSettingsStore.app.kernel
    const profile = _profile || profilesStore.getProfileById(profileID)
    if (!profile) throw 'Choose a profile first'

    await stopKernel()
    await generateConfigFile(profile)

    if (!_profile) {
      runtimeProfile = undefined
    }

    const fileName = await getKernelFileName(branch === 'latest')
    const kernelFilePath = CoreWorkingDirectory + '/' + fileName
    const kernelWorkDir = envStore.env.basePath + '/' + CoreWorkingDirectory

    loading.value = true

    const onOut = async (out: string, pid: number) => {
      logsStore.recordKernelLog(out)
      if (out.toLowerCase().includes('sing-box started')) {
        loading.value = false
        appSettingsStore.app.kernel.pid = pid
        appSettingsStore.app.kernel.running = true

        await Promise.all([refreshConfig(), refreshProviderProxies()])

        if (appSettingsStore.app.autoSetSystemProxy) {
          await envStore.setSystemProxy()
        }
      }
    }

    const onEnd = async () => {
      loading.value = false
      appSettingsStore.app.kernel.pid = 0
      appSettingsStore.app.kernel.running = false

      if (appSettingsStore.app.autoSetSystemProxy) {
        await envStore.clearSystemProxy()
      }
    }

    try {
      const pid = await ExecBackground(
        kernelFilePath,
        ['run', '--disable-color', '-c', kernelWorkDir + '/config.json', '-D', kernelWorkDir],
        // stdout
        (out: string) => onOut(out, pid),
        // end
        onEnd,
      )
    } catch (error) {
      loading.value = false
      throw error
    }
  }

  const stopKernel = async () => {
    const { pid } = appSettingsStore.app.kernel
    const running = await ignoredError(isKernelRunning, pid)
    running && (await KillProcess(pid))

    appSettingsStore.app.kernel.pid = 0
    appSettingsStore.app.kernel.running = false

    if (appSettingsStore.app.autoSetSystemProxy) {
      await envStore.clearSystemProxy()
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

  watch(
    [() => config.value.mode, () => config.value.tun.enable, () => proxies.value],
    updateTrayMenus,
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
    providers,
    refreshConfig,
    updateConfig,
    refreshProviderProxies,
    getProxyPort,
  }
})
