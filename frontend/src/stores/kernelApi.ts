import { ref } from 'vue'
import { defineStore } from 'pinia'

import { generateConfigFile, ignoredError } from '@/utils'
import type { KernelApiConfig, Proxy } from '@/api/kernel.schema'
import {
  KernelWorkDirectory,
  getKernelFileName,
  KernelConfigFilePath,
  StackOptions
} from '@/constant'
import {
  type ProfileType,
  useAppSettingsStore,
  useProfilesStore,
  useLogsStore,
  useEnvStore
} from '@/stores'
import { getProxies, getProviders } from '@/api/kernel'
import {
  EventsOn,
  KernelRunning,
  KillProcess,
  StartKernel,
  GetInterfaces,
  Readfile
} from '@/utils/bridge'
import { deepClone } from '@/utils/others'

export const useKernelApiStore = defineStore('kernelApi', () => {
  /** RESTful API */
  const config = ref<KernelApiConfig>({
    port: 0,
    'mixed-port': 0,
    'socks-port': 0,
    'log-level': '',
    'allow-lan': false,
    mode: '',
    'interface-name': '',
    tun: {
      enable: false,
      stack: 'System',
      'auto-route': true,
      device: ''
    },
    fakeip: false
  })

  const proxies = ref<Record<string, Proxy>>({})
  const providers = ref<
    Record<
      string,
      {
        name: string
        proxies: Proxy[]
      }
    >
  >({})

  const currentProfile = ref<ProfileType>()
  const keepConfig = ref<boolean>(false)

  const updateProfile = async () => {
    const appSettingsStore = useAppSettingsStore()
    const { profile: profileID } = appSettingsStore.app.kernel
    if (profileID) {
      const profilesStore = useProfilesStore()
      const result = deepClone(profilesStore.getProfileById(profileID)) as ProfileType
      const interfaces = await GetInterfaces()
      result.tunConfig.enable = interfaces.some((f) => f === result.tunConfig.interface_name)

      if (config.value.mode) {
        result.generalConfig.mode = config.value.mode
        result.advancedConfig.port = config.value.port
        result.generalConfig['mixed-port'] = config.value['mixed-port']
        result.advancedConfig['socks-port'] = config.value['socks-port']
        result.generalConfig['log-level'] = config.value['log-level']
        result.generalConfig['allow-lan'] = config.value['allow-lan']
        result.generalConfig['interface-name'] = config.value['interface-name']
        result.dnsConfig.fakeip = config.value.fakeip
        if (config.value.tun.device) {
          result.tunConfig.enable = config.value.tun.enable
          result.tunConfig.stack = config.value.tun.stack
          result.tunConfig['auto-route'] = config.value.tun['auto-route']
          result.tunConfig.interface_name = config.value.tun.device
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
    config.value['log-level'] = currentProfile.value.generalConfig['log-level']
    config.value['allow-lan'] = currentProfile.value.generalConfig['allow-lan']
    config.value.mode = currentProfile.value.generalConfig.mode
    config.value['interface-name'] = currentProfile.value.generalConfig['interface-name']
    config.value.fakeip = currentProfile.value.dnsConfig.fakeip
    config.value.tun = {
      enable: currentProfile.value.tunConfig.enable,
      stack: currentProfile.value.tunConfig.stack,
      'auto-route': currentProfile.value.tunConfig['auto-route'],
      device: currentProfile.value.tunConfig.interface_name
    }
  }

  const updateConfig = async (name: string, value: any) => {
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
      currentProfile.value.tunConfig.interface_name = value
    } else if (name == 'interface-name') {
      currentProfile.value.generalConfig['interface-name'] = value
    } else if (name == 'mode') {
      currentProfile.value.generalConfig.mode = value
    } else if (name == 'fakeip') {
      currentProfile.value.dnsConfig.fakeip = value
    }
    await generateConfigFile(currentProfile.value)
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
      latestConfig.inbounds.forEach((inbound: any) => {
        if (inbound.type == 'tun') inbound_tun = inbound
        else if (inbound.type == 'mixed') config.value['mixed-port'] = inbound.listen_port
        else if (inbound.type == 'http') config.value.port = inbound.listen_port
        else if (inbound.type == 'socks') config.value['socks-port'] = inbound.listen_port
        if (inbound.listen_port) {
          config.value['allow-lan'] = inbound.listen === '::'
        }
      })
      config.value.mode = latestConfig.experimental.clash_api.default_mode
      config.value['log-level'] = latestConfig.log.level
      config.value.fakeip = latestConfig.dns.fakeip.enabled
      if (latestConfig.route.auto_detect_interface) config.value['interface-name'] = 'Auto'
      else if (latestConfig.route.default_interface)
        config.value['interface-name'] = latestConfig.route.default_interface
      if (inbound_tun) {
        const stack = StackOptions.filter((s) => s.value.toLowerCase() === inbound_tun.stack)
        const stackName = stack.length > 0 ? stack[0].value : inbound_tun.stack
        config.value.tun = {
          enable: true,
          stack: stackName,
          'auto-route': inbound_tun.auto_route,
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

  const setupKernelApi = async () => {
    const envStore = useEnvStore()
    const logsStore = useLogsStore()
    const appSettings = useAppSettingsStore()

    EventsOn('kernelLog', logsStore.recordKernelLog)
    EventsOn('kernelPid', (pid) => {
      console.log('kernelPid')
      loading.value = true
      appSettings.app.kernel.pid = pid
    })
    EventsOn('kernelStarted', async () => {
      loading.value = false
      appSettings.app.kernel.running = true

      await refreshConfig()
      await envStore.updateSystemProxyState()

      // Automatically set system proxy, but the priority is lower than tun mode
      if (!config.value.tun.enable && appSettings.app.autoSetSystemProxy) {
        await envStore.setSystemProxy()
      }
    })
    EventsOn('kernelStopped', async () => {
      if (appSettings.app.kernel.running || loading.value || appSettings.app.kernel.pid != 0) {
        loading.value = false
        appSettings.app.kernel.pid = 0
        appSettings.app.kernel.running = false

        if (appSettings.app.autoSetSystemProxy) {
          await envStore.clearSystemProxy()
        }
      }
    })
  }

  const updateKernelStatus = async () => {
    const appSettingsStore = useAppSettingsStore()

    const { pid } = appSettingsStore.app.kernel

    const running = await ignoredError(KernelRunning, pid)

    appSettingsStore.app.kernel.running = !!running

    return appSettingsStore.app.kernel.running
  }

  const startKernel = async () => {
    const logsStore = useLogsStore()
    const profilesStore = useProfilesStore()
    const appSettingsStore = useAppSettingsStore()

    const { profile: profileID, branch, pid } = appSettingsStore.app.kernel

    if (!profileID) throw 'Choose a profile first'

    const profile = profilesStore.getProfileById(profileID)

    if (!profile) throw 'Profile does not exist: ' + profileID

    logsStore.clearKernelLog()

    if (!keepConfig.value) {
      await generateConfigFile(profile)
      currentProfile.value = deepClone(profile)
    }

    if (pid) {
      const running = await ignoredError(KernelRunning, pid)
      if (running) {
        await ignoredError(KillProcess, pid)
        appSettingsStore.app.kernel.running = false
      }
    }

    const fileName = await getKernelFileName(branch === 'latest')

    const kernelFilePath = KernelWorkDirectory + '/' + fileName

    await StartKernel(kernelFilePath, KernelWorkDirectory)
  }

  const stopKernel = async () => {
    const logsStore = useLogsStore()
    const appSettingsStore = useAppSettingsStore()

    await ignoredError(KillProcess, appSettingsStore.app.kernel.pid)

    appSettingsStore.app.kernel.running = false
    appSettingsStore.app.kernel.pid = 0

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

  return {
    startKernel,
    stopKernel,
    restartKernel,
    updateKernelStatus,
    setupKernelApi,
    loading,
    config,
    proxies,
    providers,
    refreshConfig,
    updateConfig,
    refreshProviderProxies
  }
})
