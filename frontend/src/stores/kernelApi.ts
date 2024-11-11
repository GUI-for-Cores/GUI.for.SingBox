import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { deepClone } from '@/utils/others'
import type { KernelApiConfig, Proxy } from '@/api/kernel.schema'
import { ProcessInfo, KillProcess, ExecBackground, GetInterfaces, Readfile } from '@/bridge'
import {
  KernelWorkDirectory,
  getKernelFileName,
  KernelConfigFilePath,
  StackOptions
} from '@/constant'
import { generateConfigFile, ignoredError, updateTrayMenus } from '@/utils'
import { getConfigs, setConfigs, getProxies, getProviders } from '@/api/kernel'
import {
  type ProfileType,
  useAppSettingsStore,
  useProfilesStore,
  useLogsStore,
  useEnvStore
} from '@/stores'

export type ProxyType = 'mixed' | 'http' | 'socks'

export const useKernelApiStore = defineStore('kernelApi', () => {
  /** RESTful API */
  const config = ref<KernelApiConfig>({
    port: 0,
    'mixed-port': 0,
    'socks-port': 0,
    'interface-name': '',
    'allow-lan': false,
    mode: '',
    fakeip: false,
    tun: {
      enable: false,
      stack: 'System',
      device: ''
    }
  })

  const proxies = ref<Record<string, Proxy>>({})
  const providers = ref<{
    [key: string]: {
      name: string
      proxies: Proxy[]
    }
  }>({})

  const currentProfile = ref<ProfileType>()
  const keepConfig = ref<boolean>(false)

  const updateProfile = async () => {
    const appSettingsStore = useAppSettingsStore()
    const { profile: profileID } = appSettingsStore.app.kernel
    if (profileID) {
      const profilesStore = useProfilesStore()
      const result = deepClone(profilesStore.getProfileById(profileID)) as ProfileType
      const interfaces = await GetInterfaces()
      result.tunConfig.enable = interfaces.some((f) => f === result.tunConfig['interface-name'])

      if (config.value.mode) {
        result.generalConfig.mode = config.value.mode
        result.advancedConfig.port = config.value.port
        result.generalConfig['mixed-port'] = config.value['mixed-port']
        result.advancedConfig['socks-port'] = config.value['socks-port']
        result.generalConfig['allow-lan'] = config.value['allow-lan']
        result.generalConfig['interface-name'] = config.value['interface-name']
        result.dnsConfig.fakeip = config.value.fakeip
        if (config.value.tun.device) {
          result.tunConfig.enable = config.value.tun.enable
          result.tunConfig.stack = config.value.tun.stack
          result.tunConfig['interface-name'] = config.value.tun.device
        }
      }

      currentProfile.value = result
    }
  }

  const refreshConfig = async () => {
    if (!currentProfile.value) {
      await updateProfile()
    }
    if (!currentProfile.value) {
      return
    }
    config.value.port = currentProfile.value.advancedConfig.port
    config.value['mixed-port'] = currentProfile.value.generalConfig['mixed-port']
    config.value['socks-port'] = currentProfile.value.advancedConfig['socks-port']
    config.value['allow-lan'] = currentProfile.value.generalConfig['allow-lan']
    try {
      config.value.mode = (await getConfigs()).mode
    } catch {
      config.value.mode = currentProfile.value.generalConfig.mode
    }
    config.value['interface-name'] = currentProfile.value.generalConfig['interface-name']
    config.value.fakeip = currentProfile.value.dnsConfig.fakeip
    config.value.tun = {
      enable: currentProfile.value.tunConfig.enable,
      stack: currentProfile.value.tunConfig.stack,
      device: currentProfile.value.tunConfig['interface-name']
    }
  }

  const patchConfig = async (name: string, value: any) => {
    const body: Record<string, any> = {}
    body[name] = value
    await setConfigs(body)
    await updateCurrentProfile(name, value)
  }

  const updateCurrentProfile = async (name: string, value: any) => {
    if (!currentProfile.value) {
      return
    }

    if (name == 'tun') {
      currentProfile.value.tunConfig.enable = value
    } else if (name == 'http-port') {
      currentProfile.value.advancedConfig.port = value
    } else if (name == 'socks-port') {
      currentProfile.value.advancedConfig['socks-port'] = value
    } else if (name == 'mixed-port') {
      currentProfile.value.generalConfig['mixed-port'] = value
    } else if (name == 'allow-lan') {
      currentProfile.value.generalConfig['allow-lan'] = value
    } else if (name == 'tun-stack') {
      currentProfile.value.tunConfig.stack = value
    } else if (name == 'tun-device') {
      currentProfile.value.tunConfig['interface-name'] = value
    } else if (name == 'interface-name') {
      currentProfile.value.generalConfig['interface-name'] = value
    } else if (name == 'mode') {
      currentProfile.value.generalConfig.mode = value
    } else if (name == 'fakeip') {
      currentProfile.value.dnsConfig.fakeip = value
    }

    await refreshConfig()
  }

  const updateConfig = async (name: string, value: any) => {
    updateCurrentProfile(name, value)
    if (currentProfile.value) {
      await generateConfigFile(currentProfile.value)
    }
    await restartKernelKeepConfig()
  }

  const refreshProviderProxies = async () => {
    const [{ providers: a }, { proxies: b }] = await Promise.all([getProviders(), getProxies()])
    providers.value = a
    proxies.value = b
  }

  const initConfig = async () => {
    const content = (await ignoredError(Readfile, KernelConfigFilePath)) || '{}'
    if (!content) return
    try {
      const latestConfig: Record<string, any> = JSON.parse(content)
      config.value.port = 0
      config.value['mixed-port'] = 0
      config.value['socks-port'] = 0
      let inbound_tun: any = null
      latestConfig.inbounds?.forEach((inbound: any) => {
        if (inbound.type == 'tun') inbound_tun = inbound
        else if (inbound.type == 'mixed') config.value['mixed-port'] = inbound.listen_port
        else if (inbound.type == 'http') config.value.port = inbound.listen_port
        else if (inbound.type == 'socks') config.value['socks-port'] = inbound.listen_port
        if (inbound.listen_port) {
          config.value['allow-lan'] = inbound.listen === '::'
        }
      })

      try {
        config.value.mode = (await getConfigs()).mode
      } catch {
        config.value.mode = latestConfig.experimental?.clash_api.default_mode
      }

      config.value.fakeip = latestConfig.dns?.fakeip.enabled
      if (latestConfig.route?.auto_detect_interface) config.value['interface-name'] = 'Auto'
      else if (latestConfig.route?.default_interface)
        config.value['interface-name'] = latestConfig.route.default_interface
      if (inbound_tun) {
        const stack = StackOptions.filter((s) => s.value.toLowerCase() === inbound_tun.stack)
        const stackName = stack.length > 0 ? stack[0].value : inbound_tun.stack
        config.value.tun = {
          enable: true,
          stack: stackName,
          device: inbound_tun.interface_name
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  initConfig()

  /* Bridge API */
  const loading = ref(false)
  const statusLoading = ref(true)

  const isKernelRunning = async (pid: number) => {
    return pid && (await ProcessInfo(pid)).startsWith('sing-box')
  }

  const updateKernelState = async () => {
    const envStore = useEnvStore()
    const appSettingsStore = useAppSettingsStore()

    appSettingsStore.app.kernel.running = !!(await ignoredError(
      isKernelRunning,
      appSettingsStore.app.kernel.pid
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

  const startKernel = async () => {
    const envStore = useEnvStore()
    const logsStore = useLogsStore()
    const profilesStore = useProfilesStore()
    const appSettingsStore = useAppSettingsStore()

    const { profile: profileID, branch } = appSettingsStore.app.kernel

    if (!profileID) throw 'Choose a profile first'

    const profile = profilesStore.getProfileById(profileID)

    if (!profile) throw 'Profile does not exist: ' + profileID

    await stopKernel()

    if (!keepConfig.value) {
      await generateConfigFile(profile)
      currentProfile.value = deepClone(profile)
    }

    const fileName = await getKernelFileName(branch === 'latest')
    const kernelFilePath = KernelWorkDirectory + '/' + fileName
    const kernelWorkDir = envStore.env.basePath + '/' + KernelWorkDirectory

    loading.value = true

    const onOut = async (out: string, pid: number) => {
      logsStore.recordKernelLog(out)
      if (out.toLowerCase().includes('sing-box started')) {
        loading.value = false
        appSettingsStore.app.kernel.pid = pid
        appSettingsStore.app.kernel.running = true

        await Promise.all([refreshConfig(), refreshProviderProxies()])

        if (config.value.tun.enable) {
          if (envStore.systemProxy) {
            updateConfig('tun', false)
          }
        } else if (appSettingsStore.app.autoSetSystemProxy) {
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
        {
          env: {
            ENABLE_DEPRECATED_: 'true',
            ENABLE_DEPRECATED_LEGACY_DNS_ROUTE_OPTIONS: 'true'
          }
        }
      )
    } catch (error) {
      loading.value = false
      throw error
    }
  }

  const stopKernel = async () => {
    const envStore = useEnvStore()
    const logsStore = useLogsStore()
    const appSettingsStore = useAppSettingsStore()

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

  const restartKernelKeepConfig = async () => {
    keepConfig.value = true
    await stopKernel()
    await startKernel()
    keepConfig.value = false
  }

  const restartKernel = async () => {
    await stopKernel()
    await startKernel()
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
        proxyType: 'mixed'
      }
    }
    if (port) {
      return {
        port,
        proxyType: 'http'
      }
    }
    if (socksPort) {
      return {
        port: socksPort,
        proxyType: 'socks'
      }
    }
    return undefined
  }

  watch(
    [() => config.value.mode, () => config.value.tun.enable, () => proxies.value],
    updateTrayMenus
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
    patchConfig,
    refreshProviderProxies,
    getProxyPort
  }
})
