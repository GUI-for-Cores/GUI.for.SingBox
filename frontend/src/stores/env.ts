import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { GetEnv, GetSystemProxy, SetSystemDNS, SetSystemProxy } from '@/bridge'
import { OS } from '@/enums/app'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import { formatProxyHost, ignoredError, updateTrayAndMenus } from '@/utils'

import type { AppEnv } from '@/types/app'

export const useEnvStore = defineStore('env', () => {
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  const env = ref<AppEnv>({
    appName: '',
    appVersion: '',
    basePath: '',
    appPath: '',
    os: '' as OS,
    arch: '',
    isPrivileged: false,
  })

  const systemProxy = ref(false)
  const systemDNSSet = ref(false)

  const setupEnv = async () => {
    const _env = await GetEnv()
    let appPath = `${_env.basePath}/${_env.appName}`
    if (_env.os === OS.Windows) {
      appPath = appPath.replaceAll('/', '\\')
    } else if (_env.os === OS.Darwin) {
      appPath = appPath.replace(`/Contents/MacOS/${_env.appName}`, '')
    }
    env.value = { ..._env, appPath }
  }

  const updateSystemProxyStatus = async () => {
    const kernelApiStore = useKernelApiStore()
    const proxyServer = (await ignoredError(GetSystemProxy)) || ''

    if (!proxyServer) {
      systemProxy.value = false
    } else {
      const kernelProxy = kernelApiStore.getProxyEndpoint()
      if (!kernelProxy) {
        systemProxy.value = false
        return systemProxy.value
      }

      const { host, port, proxyType } = kernelProxy
      const server = `${formatProxyHost(host)}:${port}`
      const proxyServerList = [
        `http://${server}`,
        `https://${server}`,
        `socks5://${server}`,
        `socks=${server}`,
      ]
      if (proxyType === 'mixed') {
        proxyServerList.push(
          `http://127.0.0.1:${port}`,
          `https://127.0.0.1:${port}`,
          `socks5://127.0.0.1:${port}`,
          `socks=127.0.0.1:${port}`,
        )
      }
      systemProxy.value = proxyServerList.includes(proxyServer)
    }

    return systemProxy.value
  }

  const setSystemProxy = async () => {
    const proxyBypassList = appSettings.app.proxyBypassList
    const services = appSettings.app.systemProxyServices
    let proxyEndpoint = kernelApiStore.getProxyEndpoint()
    if (!proxyEndpoint) {
      await kernelApiStore.updateConfig('inbound', undefined)
    }
    proxyEndpoint = kernelApiStore.getProxyEndpoint()
    if (!proxyEndpoint) throw 'home.overview.needPort'
    const server = `${formatProxyHost(proxyEndpoint.host)}:${proxyEndpoint.port}`
    await SetSystemProxy(true, server, proxyEndpoint.proxyType, proxyBypassList, services)
    systemProxy.value = true
  }

  const clearSystemProxy = async () => {
    const proxyBypassList = appSettings.app.proxyBypassList
    const services = appSettings.app.systemProxyServices
    await SetSystemProxy(false, '', undefined, proxyBypassList, services)
    systemProxy.value = false
  }

  const switchSystemProxy = async (enable: boolean) => {
    if (enable) await setSystemProxy()
    else await clearSystemProxy()
  }

  const setSystemDNS = async (proxy: boolean) => {
    if (![OS.Linux, OS.Darwin].includes(env.value.os)) return
    const servers = proxy ? appSettings.app.systemProxyDNS : appSettings.app.systemDefaultDNS
    await SetSystemDNS(servers, appSettings.app.systemProxyServices)
    systemDNSSet.value = proxy
  }

  watch(systemProxy, updateTrayAndMenus)

  return {
    env,
    setupEnv,
    systemProxy,
    systemDNSSet,
    setSystemProxy,
    clearSystemProxy,
    switchSystemProxy,
    updateSystemProxyStatus,
    setSystemDNS,
  }
})
