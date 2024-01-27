import { ref } from 'vue'
import { defineStore } from 'pinia'

import { useKernelApiStore, useAppStore } from '@/stores'
import { SetSystemProxy, GetEnv, ClearSystemProxy, GetSystemProxy } from '@/utils/bridge'

export const useEnvStore = defineStore('env', () => {
  const env = ref({
    appName: 'GUI.for.SingBox.exe',
    basePath: 'path/to/GUI.for.SingBox',
    os: 'windows',
    arch: 'amd64'
  })

  const systemProxy = ref(false)

  const setupEnv = async () => {
    const _env = await GetEnv()
    env.value = _env
  }

  const updateSystemProxyState = async () => {
    const kernelApiStore = useKernelApiStore()
    const proxyServer = await GetSystemProxy()

    if (!proxyServer) {
      systemProxy.value = false
    } else {
      const { port: _port, 'mixed-port': mixedPort } = kernelApiStore.config
      const proxyServerList = [`127.0.0.1:${_port}`, `127.0.0.1:${mixedPort}`]
      systemProxy.value = proxyServerList.includes(proxyServer)
    }

    return systemProxy.value
  }

  const setSystemProxy = async () => {
    const appStore = useAppStore()
    const kernelApiStore = useKernelApiStore()

    let port = 0
    const { port: _port, 'socks-port': socksPort, 'mixed-port': mixedPort } = kernelApiStore.config

    if (mixedPort) {
      port = mixedPort
    } else if (_port) {
      port = _port
    } else if (socksPort) throw 'home.overview.notSupportSocks'

    if (!port) throw 'home.overview.needPort'

    await SetSystemProxy(port)

    systemProxy.value = true
    appStore.updateTrayMenus()
  }

  const clearSystemProxy = async () => {
    const appStore = useAppStore()
    
    await ClearSystemProxy()
    systemProxy.value = false

    appStore.updateTrayMenus()
  }

  const switchSystemProxy = async (enable: boolean) => {
    if (enable) await setSystemProxy()
    else await clearSystemProxy()
  }

  return {
    env,
    setupEnv,
    systemProxy,
    setSystemProxy,
    clearSystemProxy,
    switchSystemProxy,
    updateSystemProxyState
  }
})
