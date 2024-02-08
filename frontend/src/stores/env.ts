import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { updateTrayMenus } from '@/utils'
import { useKernelApiStore } from '@/stores'
import { SetSystemProxy, ClearSystemProxy, GetSystemProxy, GetEnv } from '@/utils/bridge'

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
  }

  const clearSystemProxy = async () => {
    await ClearSystemProxy()
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
    updateSystemProxyState
  }
})
