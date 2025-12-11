import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { GetEnv } from '@/bridge'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import { updateTrayMenus, SetSystemProxy, GetSystemProxy } from '@/utils'

export const useEnvStore = defineStore('env', () => {
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  const env = ref({
    appName: '',
    appVersion: '',
    basePath: '',
    appPath: '',
    os: '',
    arch: '',
  })

  const systemProxy = ref(false)

  const setupEnv = async () => {
    const _env = await GetEnv()
    const appPath = `${_env.basePath}/${_env.appName}`
    env.value = {
      ..._env,
      appPath: _env.os === 'windows' ? appPath.replaceAll('/', '\\') : appPath,
    }
  }

  const updateSystemProxyStatus = async () => {
    const kernelApiStore = useKernelApiStore()
    const proxyServer = await GetSystemProxy()

    if (!proxyServer) {
      systemProxy.value = false
    } else {
      const { port, 'mixed-port': mixedPort, 'socks-port': socksPort } = kernelApiStore.config
      const proxyServerList = [
        `http://127.0.0.1:${port}`,
        `http://127.0.0.1:${mixedPort}`,

        `socks5://127.0.0.1:${mixedPort}`,
        `socks5://127.0.0.1:${socksPort}`,

        `socks=127.0.0.1:${mixedPort}`,
        `socks=127.0.0.1:${socksPort}`,
      ]
      systemProxy.value = proxyServerList.includes(proxyServer)
    }

    return systemProxy.value
  }

  const setSystemProxy = async () => {
    const proxyBypassList = appSettings.app.proxyBypassList
    let proxyPort = kernelApiStore.getProxyPort()

    if (!proxyPort) {
      await kernelApiStore.updateConfig('inbound', undefined)
    }

    proxyPort = kernelApiStore.getProxyPort()

    if (!proxyPort) throw 'home.overview.needPort'

    await SetSystemProxy(true, '127.0.0.1:' + proxyPort.port, proxyPort.proxyType, proxyBypassList)

    systemProxy.value = true
  }

  const clearSystemProxy = async () => {
    const proxyBypassList = appSettings.app.proxyBypassList
    await SetSystemProxy(false, '', undefined, proxyBypassList)
    systemProxy.value = false
  }

  const switchSystemProxy = async (enable: boolean) => {
    if (enable) await setSystemProxy()
    else await clearSystemProxy()
  }

  watch(systemProxy, updateTrayMenus)

  return {
    env,
    setupEnv,
    systemProxy,
    setSystemProxy,
    clearSystemProxy,
    switchSystemProxy,
    updateSystemProxyStatus,
  }
})
