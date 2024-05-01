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
    x64Level: 0
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
        `127.0.0.1:${port}`,
        `127.0.0.1:${mixedPort}`,
        `127.0.0.1:${socksPort}`
      ]
      systemProxy.value = proxyServerList.includes(proxyServer)
    }

    return systemProxy.value
  }

  const setSystemProxy = async () => {
    const kernelApiStore = useKernelApiStore()

    let port = 0
    let proxyType = 0 // 0: Mixed    1: Http    2: Socks
    const { port: _port, 'socks-port': socksPort, 'mixed-port': mixedPort } = kernelApiStore.config

    if (mixedPort) {
      port = mixedPort
      proxyType = 0
    } else if (_port) {
      port = _port
      proxyType = 1
    } else if (socksPort) {
      port = socksPort
      proxyType = 2
    }

    if (!port) throw 'home.overview.needPort'

    await SetSystemProxy(true, '127.0.0.1:' + port, proxyType)

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
    updateSystemProxyStatus
  }
})
