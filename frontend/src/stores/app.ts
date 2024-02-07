import { ref } from 'vue'
import { defineStore } from 'pinia'

import i18n from '@/lang'
import type { MenuItem } from '@/constant'
import { debounce, sampleID } from '@/utils'
import { deleteConnection, getConnections, useProxy } from '@/api/kernel'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, usePluginsStore } from '@/stores'
import {
  EventsOff,
  EventsOn,
  UpdateTrayMenus,
  WindowHide,
  WindowShow,
  RestartApp,
  ExitApp,
  UpdateTray
} from '@/utils/bridge'

export type Menu = {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[]
}

export const useAppStore = defineStore('app', () => {
  /* Global Menu */
  const menuShow = ref(false)
  const menuList = ref<Menu[]>([])
  const menuPosition = ref({
    x: 0,
    y: 0
  })

  /* Global Tips */
  const tipsShow = ref(false)
  const tipsMessage = ref('')
  const tipsPosition = ref({
    x: 0,
    y: 0
  })

  /* System Tray & Menus */
  const exitApp = async () => {
    const envStore = useEnvStore()
    const pluginsStore = usePluginsStore()
    const appSettings = useAppSettingsStore()
    const kernelApiStore = useKernelApiStore()

    if (appSettings.app.kernel.running && appSettings.app.closeKernelOnExit) {
      await kernelApiStore.stopKernel()
      if (appSettings.app.autoSetSystemProxy) {
        envStore.clearSystemProxy()
      }
    }

    setTimeout(ExitApp, 3_000)

    try {
      await pluginsStore.onShutdownTrigger()
    } catch (error: any) {
      window.Plugins.message.error(error)
    }

    ExitApp()
  }

  const menuEvents: string[] = []

  const generateUniqueEventsForMenu = (menus: MenuItem[]) => {
    const { t } = i18n.global

    menuEvents.forEach((event) => EventsOff(event))
    menuEvents.splice(0)

    function processMenu(menu: MenuItem) {
      const _menu = { ...menu, text: t(menu.text || ''), tooltip: t(menu.tooltip || '') }
      const { event, children } = menu

      if (event) {
        const _event = sampleID()
        _menu.event = _event
        menuEvents.push(_event)
        EventsOn(_event, event as any)
      }

      if (children && children.length > 0) {
        _menu.children = children.map(processMenu)
      }

      return _menu
    }

    return menus.map(processMenu)
  }

  const handleUseProxy = async (group: any, proxy: any) => {
    if (group.type !== 'Selector' || group.now === proxy.name) return
    const promises: Promise<null>[] = []
    const appSettings = useAppSettingsStore()
    const kernelApiStore = useKernelApiStore()
    if (appSettings.app.kernel.autoClose) {
      const { connections } = await getConnections()
      promises.push(
        ...(connections || [])
          .filter((v) => v.chains.includes(group.name))
          .map((v) => deleteConnection(v.id))
      )
    }
    await useProxy(group.name, proxy.name)
    await Promise.all(promises)
    await kernelApiStore.refreshProviderProxies()
  }

  const updateTrayMenus = debounce(async () => {
    const envStore = useEnvStore()
    const appSettings = useAppSettingsStore()
    const kernelApiStore = useKernelApiStore()

    const { proxies } = kernelApiStore

    const groupsMenus: MenuItem[] = (() => {
      if (!proxies) return []
      return Object.values(proxies)
        .filter((v) => v.all && !['GLOBAL', 'Fallback'].includes(v.name))
        .map((provider) => {
          const all = provider.all
            .filter((v) => {
              if (
                appSettings.app.kernel.unAvailable ||
                ['direct', 'block'].includes(v) ||
                proxies[v].all
              ) {
                return true
              }
              const history = proxies[v].history || []
              return history && history[history.length - 1]?.delay > 0
            })
            .map((v) => {
              const history = proxies[v].history || []
              const delay = history[history.length - 1]?.delay || 0
              return { ...proxies[v], delay }
            })
            .sort((a, b) => {
              if (!appSettings.app.kernel.sortByDelay || a.delay === b.delay) return 0
              if (!a.delay) return 1
              if (!b.delay) return -1
              return a.delay - b.delay
            })
          return { ...provider, all }
        })
        .map((group) => {
          return {
            type: 'item',
            text: group.name,
            show: true,
            children: group.all.map((proxy) => {
              return {
                type: 'item',
                text: proxy.name,
                show: true,
                checked: proxy.name === group.now,
                event: () => {
                  console.log(group, proxy)
                  handleUseProxy(group, proxy)
                }
              }
            })
          }
        })
    })()

    const trayMenus: MenuItem[] = [
      ...groupsMenus,
      {
        type: 'separator',
        show: groupsMenus.length !== 0
      },
      {
        type: 'item',
        text: 'tray.kernel',
        show: true,
        children: [
          {
            type: 'item',
            text: 'tray.startKernel',
            show: !appSettings.app.kernel.running,
            event: kernelApiStore.startKernel
          },
          {
            type: 'item',
            text: 'tray.restartKernel',
            show: appSettings.app.kernel.running,
            event: kernelApiStore.restartKernel
          },
          {
            type: 'item',
            text: 'tray.stopKernel',
            show: appSettings.app.kernel.running,
            event: kernelApiStore.stopKernel
          }
        ]
      },
      {
        type: 'item',
        text: 'tray.proxy',
        show: appSettings.app.kernel.running,
        children: [
          {
            type: 'item',
            text: 'tray.setSystemProxy',
            show: !envStore.systemProxy,
            event: async () => {
              // await kernelApiStore.updateConfig('tun', false)
              await envStore.setSystemProxy()
            }
          },
          {
            type: 'item',
            text: 'tray.clearSystemProxy',
            show: envStore.systemProxy,
            event: envStore.clearSystemProxy
          }
        ]
      },
      {
        type: 'item',
        text: 'tray.tun',
        show: appSettings.app.kernel.running,
        children: [
          {
            type: 'item',
            text: 'tray.enableTunMode',
            show: !kernelApiStore.config.tun.enable,
            event: async () => {
              // await envStore.clearSystemProxy()
              await kernelApiStore.updateConfig('tun', true)
            }
          },
          {
            type: 'item',
            text: 'tray.disableTunMode',
            show: kernelApiStore.config.tun.enable,
            event: async () => {
              await kernelApiStore.updateConfig('tun', false)
            }
          }
        ]
      },
      {
        type: 'item',
        text: 'tray.show',
        show: true,
        tooltip: 'tray.showTip',
        event: WindowShow
      },
      {
        type: 'item',
        text: 'tray.hide',
        show: true,
        tooltip: 'tray.hideTip',
        event: WindowHide
      },
      {
        type: 'separator',
        show: true
      },
      {
        type: 'item',
        text: 'tray.restart',
        show: true,
        tooltip: 'tray.restartTip',
        event: RestartApp
      },
      {
        type: 'item',
        text: 'tray.exit',
        show: true,
        tooltip: 'tray.exitTip',
        event: exitApp
      }
    ]

    const processedMenus = generateUniqueEventsForMenu(trayMenus)

    let icon = `normal.ico`

    if (appSettings.app.kernel.running) {
      if (kernelApiStore.config.tun.enable) {
        icon = `tun.ico`
      } else if (envStore.systemProxy) {
        icon = `proxy.ico`
      }
    }

    await UpdateTray({ icon })
    await UpdateTrayMenus(processedMenus as any)
  }, 500)

  return {
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    updateTrayMenus,
    exitApp
  }
})
