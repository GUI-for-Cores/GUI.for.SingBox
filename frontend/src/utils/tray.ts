import i18n from '@/lang'
import { Theme, type MenuItem, Color, Lang } from '@/constant'
import { debounce, sampleID } from '@/utils'
import { deleteConnection, getConnections, useProxy } from '@/api/kernel'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, usePluginsStore } from '@/stores'
import {
  RestartApp,
  EventsOn,
  EventsOff,
  ExitApp,
  UpdateTray,
  UpdateTrayMenus
} from '@/utils/bridge'

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

const handleChangeMode = async (mode: string) => {
  const kernelApiStore = useKernelApiStore()

  if (mode === kernelApiStore.config.mode) return

  kernelApiStore.patchConfig('mode', mode)

  const { connections } = await getConnections()
  const promises = (connections || []).map((v) => deleteConnection(v.id))
  await Promise.all(promises)
}

export const exitApp = async () => {
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

const getTrayMenus = () => {
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
                handleUseProxy(group, proxy)
              }
            }
          })
        }
      })
  })()

  const trayMenus: MenuItem[] = [
    {
      type: 'item',
      text: 'kernel.mode',
      hidden: !appSettings.app.kernel.running,
      children: [
        {
          type: 'item',
          text: 'kernel.global',
          checked: kernelApiStore.config.mode === 'global',
          event: () => handleChangeMode('global')
        },
        {
          type: 'item',
          text: 'kernel.rule',
          checked: kernelApiStore.config.mode === 'rule',
          event: () => handleChangeMode('rule')
        },
        {
          type: 'item',
          text: 'kernel.direct',
          checked: kernelApiStore.config.mode === 'direct',
          event: () => handleChangeMode('direct')
        }
      ]
    },
    {
      type: 'item',
      text: 'tray.proxyGroup',
      hidden: !appSettings.app.kernel.running,
      children: groupsMenus
    },
    {
      type: 'item',
      text: 'tray.kernel',
      children: [
        {
          type: 'item',
          text: 'tray.startKernel',
          hidden: appSettings.app.kernel.running,
          event: kernelApiStore.startKernel
        },
        {
          type: 'item',
          text: 'tray.restartKernel',
          hidden: !appSettings.app.kernel.running,
          event: kernelApiStore.restartKernel
        },
        {
          type: 'item',
          text: 'tray.stopKernel',
          hidden: !appSettings.app.kernel.running,
          event: kernelApiStore.stopKernel
        }
      ]
    },
    {
      type: 'separator',
      hidden: !appSettings.app.kernel.running
    },
    {
      type: 'item',
      text: 'tray.proxy',
      hidden: !appSettings.app.kernel.running,
      children: [
        {
          type: 'item',
          text: 'tray.setSystemProxy',
          hidden: envStore.systemProxy,
          event: async () => {
            await kernelApiStore.updateConfig('tun', false)
            await envStore.setSystemProxy()
          }
        },
        {
          type: 'item',
          text: 'tray.clearSystemProxy',
          hidden: !envStore.systemProxy,
          event: envStore.clearSystemProxy
        }
      ]
    },
    {
      type: 'item',
      text: 'tray.tun',
      hidden: !appSettings.app.kernel.running,
      children: [
        {
          type: 'item',
          text: 'tray.enableTunMode',
          hidden: kernelApiStore.config.tun.enable,
          event: async () => {
            await envStore.clearSystemProxy()
            await kernelApiStore.updateConfig('tun', true)
          }
        },
        {
          type: 'item',
          text: 'tray.disableTunMode',
          hidden: !kernelApiStore.config.tun.enable,
          event: async () => {
            await kernelApiStore.updateConfig('tun', false)
          }
        }
      ]
    },
    {
      type: 'item',
      text: 'settings.general',
      children: [
        {
          type: 'item',
          text: 'settings.theme.name',
          children: [
            {
              type: 'item',
              text: 'settings.theme.dark',
              checked: appSettings.app.theme === Theme.Dark,
              event: () => (appSettings.app.theme = Theme.Dark)
            },
            {
              type: 'item',
              text: 'settings.theme.light',
              checked: appSettings.app.theme === Theme.Light,
              event: () => (appSettings.app.theme = Theme.Light)
            },
            {
              type: 'item',
              text: 'settings.theme.auto',
              checked: appSettings.app.theme === Theme.Auto,
              event: () => (appSettings.app.theme = Theme.Auto)
            }
          ]
        },
        {
          type: 'item',
          text: 'settings.color.name',
          children: [
            {
              type: 'item',
              text: 'settings.color.default',
              checked: appSettings.app.color === Color.Default,
              event: () => (appSettings.app.color = Color.Default)
            },
            {
              type: 'item',
              text: 'settings.color.orange',
              checked: appSettings.app.color === Color.Orange,
              event: () => (appSettings.app.color = Color.Orange)
            },
            {
              type: 'item',
              text: 'settings.color.pink',
              checked: appSettings.app.color === Color.Pink,
              event: () => (appSettings.app.color = Color.Pink)
            },
            {
              type: 'item',
              text: 'settings.color.skyblue',
              checked: appSettings.app.color === Color.Skyblue,
              event: () => (appSettings.app.color = Color.Skyblue)
            }
          ]
        },
        {
          type: 'item',
          text: 'settings.lang.name',
          children: [
            {
              type: 'item',
              text: 'settings.lang.zh',
              checked: appSettings.app.lang === Lang.ZH,
              event: () => (appSettings.app.lang = Lang.ZH)
            },
            {
              type: 'item',
              text: 'settings.lang.en',
              checked: appSettings.app.lang === Lang.EN,
              event: () => (appSettings.app.lang = Lang.EN)
            }
          ]
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      type: 'item',
      text: 'tray.restart',
      tooltip: 'tray.restartTip',
      event: RestartApp
    },
    {
      type: 'item',
      text: 'tray.exit',
      tooltip: 'tray.exitTip',
      event: exitApp
    }
  ]

  return generateUniqueEventsForMenu(trayMenus)
}

const getTrayIcons = () => {
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  let icon = `normal.ico`

  if (appSettings.app.kernel.running) {
    if (kernelApiStore.config.tun.enable) {
      icon = `tun.ico`
    } else if (envStore.systemProxy) {
      icon = `proxy.ico`
    }
  }
  return icon
}

export const updateTrayMenus = debounce(async () => {
  const trayMenus = getTrayMenus()
  const trayIcons = getTrayIcons()
  await UpdateTray({ icon: trayIcons })
  await UpdateTrayMenus(trayMenus as any)
}, 500)
