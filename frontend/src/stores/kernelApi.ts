import { ref } from 'vue'
import { defineStore } from 'pinia'

import { generateConfigFile, ignoredError } from '@/utils'
import type { KernelApiConfig, Proxy } from '@/api/kernel.schema'
import { KernelWorkDirectory, getKernelFileName } from '@/constant'
import { type ProfileType, useAppSettingsStore, useProfilesStore, useLogsStore , useEnvStore } from '@/stores'
import { getProxies, getProviders } from '@/api/kernel'
import { EventsOn, KernelRunning, KillProcess, StartKernel } from '@/utils/bridge'
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

  const getProfile = () => {
    const appSettingsStore = useAppSettingsStore()
    const { profile: profileID } = appSettingsStore.app.kernel
    if (profileID) {
      const profilesStore = useProfilesStore()
      return profilesStore.getProfileById(profileID) as ProfileType
    }
    return {} as ProfileType
  }

  const currentProfile = ref<ProfileType>(getProfile())
  const isRestarting = ref<boolean>(false)

  const refreshConfig = async () => {
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
    await restartKernel()
  }

  const refreshProviderProxies = async () => {
    const [{ providers: a }, { proxies: b }] = await Promise.all([getProviders(), getProxies()])
    providers.value = a
    proxies.value = b
  }

  /* Bridge API */
  const loading = ref(false)

  const setupKernelApi = async () => {
    const envStore = useEnvStore()
    const logsStore = useLogsStore()
    const appSettings = useAppSettingsStore()

    EventsOn('kernelLog', logsStore.recordKernelLog)
    EventsOn('kernelPid', (pid) => {
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
      loading.value = false
      appSettings.app.kernel.pid = 0
      appSettings.app.kernel.running = false

      if (appSettings.app.autoSetSystemProxy) {
        await envStore.clearSystemProxy()
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

    if (!isRestarting.value) {
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

  const restartKernel = async () => {
    isRestarting.value = true
    await stopKernel()
    await startKernel()
    isRestarting.value = false
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
