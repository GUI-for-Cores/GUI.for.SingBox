import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { GetEnv } from '@/bridge'
import { updateTrayMenus } from '@/utils'
import { useKernelApiStore } from '@/stores'
import { SetSystemProxy, GetSystemProxy } from '@/utils'

export const useEnvStore = defineStore('env', () => {
  const env = ref({
    appName: '',
    basePath: '',
    os: '',
    arch: '',
    x64Level: 0,
  })

  const systemProxy = ref(false)

  const setupEnv = async () => {
    const _env = await GetEnv()
    env.value = _env
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
    const proxyPort = useKernelApiStore().getProxyPort()
    if (!proxyPort) throw 'home.overview.needPort'

    await SetSystemProxy(true, '127.0.0.1:' + proxyPort.port, proxyPort.proxyType)

    systemProxy.value = true
  }

  const clearSystemProxy = async () => {
    await SetSystemProxy(false, '')
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
