import i18n from '@/lang'
import { ClashMode } from '@/enums/kernel'
import { Theme, Color, Lang } from '@/enums/app'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, usePluginsStore } from '@/stores'
import {
  Notify,
  RestartApp,
  EventsOn,
  EventsOff,
  UpdateTray,
  UpdateTrayMenus,
  ShowMainWindow
} from '@/bridge'
import {
  debounce,
  exitApp,
  handleChangeMode,
  sampleID,
  APP_TITLE,
  APP_VERSION,
  handleUseProxy
} from '@/utils'

const getTrayIcons = () => {
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  const themeMode = appSettings.themeMode
  const ext = envStore.env.os === 'linux' ? '.png' : '.ico'
  const folder = envStore.env.os === 'linux' ? 'imgs' : 'icons'
  let icon = `data/.cache/${folder}/tray_normal_${themeMode}${ext}`

  if (appSettings.app.kernel.running) {
    if (kernelApiStore.config.tun.enable) {
      icon = `data/.cache/${folder}/tray_tun_${themeMode}${ext}`
    } else if (envStore.systemProxy) {
      icon = `data/.cache/${folder}/tray_proxy_${themeMode}${ext}`
    }
  }
  return icon
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

const getTrayMenus = () => {
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()
  const pluginsStore = usePluginsStore()

  const { proxies } = kernelApiStore

  const groupsMenus: MenuItem[] = (() => {
    if (!proxies) return []
    return Object.values(proxies)
      .filter((v) => ['Selector', 'URLTest', 'Direct'].includes(v.type) && v.name !== 'GLOBAL')
      .concat(proxies.GLOBAL || [])
      .map((group) => {
        const all = (group.all || [])
          .filter((proxy) => {
            const history = proxies[proxy].history || []
            const alive = history[history.length - 1]?.delay > 0
            return (
              appSettings.app.kernel.unAvailable ||
              ['direct', 'block'].includes(proxy) ||
              proxies[proxy].all ||
              alive
            )
          })
          .map((proxy) => {
            const history = proxies[proxy].history || []
            const delay = history[history.length - 1]?.delay || 0
            return { ...proxies[proxy], delay }
          })
          .sort((a, b) => {
            if (!appSettings.app.kernel.sortByDelay || a.delay === b.delay) return 0
            if (!a.delay) return 1
            if (!b.delay) return -1
            return a.delay - b.delay
          })
        return { ...group, all }
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

  let pluginMenus: MenuItem[] = []
  let pluginMenusHidden = !appSettings.app.addPluginToMenu

  if (!pluginMenusHidden) {
    const filtered = pluginsStore.plugins.filter(
      (plugin) => Object.keys(plugin.menus).length && !plugin.disabled
    )
    pluginMenusHidden = filtered.length === 0
    pluginMenus = filtered.map(({ id, name, menus }) => {
      return {
        type: 'item',
        text: name,
        children: Object.entries(menus).map(([text, event]) => {
          return {
            type: 'item',
            text,
            event: () => {
              pluginsStore.manualTrigger(id, event as any).catch((err: any) => {
                Notify('Error', err.message || err)
              })
            }
          }
        })
      }
    })
  }

  const trayMenus: MenuItem[] = [
    {
      type: 'item',
      text: 'tray.showMainWindow',
      hidden: envStore.env.os === 'windows',
      event: ShowMainWindow
    },
    {
      type: 'separator',
      hidden: envStore.env.os === 'windows'
    },
    {
      type: 'item',
      text: 'kernel.mode',
      hidden: !appSettings.app.kernel.running,
      children: [
        {
          type: 'item',
          text: 'kernel.global',
          checked: kernelApiStore.config.mode === ClashMode.Global,
          event: () => handleChangeMode(ClashMode.Global)
        },
        {
          type: 'item',
          text: 'kernel.rule',
          checked: kernelApiStore.config.mode === ClashMode.Rule,
          event: () => handleChangeMode(ClashMode.Rule)
        },
        {
          type: 'item',
          text: 'kernel.direct',
          checked: kernelApiStore.config.mode === ClashMode.Direct,
          event: () => handleChangeMode(ClashMode.Direct)
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
          event: envStore.setSystemProxy
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
          event: envStore.clearSystemProxy
        },
        {
          type: 'item',
          text: 'tray.disableTunMode',
          hidden: !kernelApiStore.config.tun.enable,
          event: () => kernelApiStore.updateConfig('tun', { enable: false })
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
              text: 'settings.color.red',
              checked: appSettings.app.color === Color.Red,
              event: () => (appSettings.app.color = Color.Red)
            },
            {
              type: 'item',
              text: 'settings.color.skyblue',
              checked: appSettings.app.color === Color.Skyblue,
              event: () => (appSettings.app.color = Color.Skyblue)
            },
            {
              type: 'item',
              text: 'settings.color.green',
              checked: appSettings.app.color === Color.Green,
              event: () => (appSettings.app.color = Color.Green)
            },
            {
              type: 'item',
              text: 'settings.color.purple',
              checked: appSettings.app.color === Color.Purple,
              event: () => (appSettings.app.color = Color.Purple)
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
      type: 'item',
      text: 'tray.plugins',
      hidden: pluginMenusHidden,
      children: pluginMenus
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

export const updateTrayMenus = debounce(async () => {
  const trayMenus = getTrayMenus()
  const trayIcons = getTrayIcons()

  const isDarwin = useEnvStore().env.os === 'darwin'
  const title = isDarwin ? '' : APP_TITLE

  await UpdateTray({ icon: trayIcons, title, tooltip: APP_TITLE + ' ' + APP_VERSION })
  await UpdateTrayMenus(trayMenus as any)
}, 500)
