import {
  Notify,
  RestartApp,
  EventsOn,
  EventsOff,
  UpdateTray,
  UpdateTrayMenus,
  ShowMainWindow,
} from '@/bridge'
import { ColorOptions, ThemeOptions } from '@/constant/app'
import { ModeOptions } from '@/constant/kernel'
import i18n from '@/lang'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, usePluginsStore } from '@/stores'
import {
  debounce,
  exitApp,
  handleChangeMode,
  APP_TITLE,
  APP_VERSION,
  handleUseProxy,
} from '@/utils'

import type { MenuItem } from '@/types/app'

const getTrayIcons = () => {
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  const themeMode = appSettings.themeMode
  const ext = envStore.env.os === 'linux' ? '.png' : '.ico'
  const folder = envStore.env.os === 'linux' ? 'imgs' : 'icons'
  let icon = `data/.cache/${folder}/tray_normal_${themeMode}${ext}`

  if (kernelApiStore.running) {
    if (kernelApiStore.config.tun.enable) {
      icon = `data/.cache/${folder}/tray_tun_${themeMode}${ext}`
    } else if (envStore.systemProxy) {
      icon = `data/.cache/${folder}/tray_proxy_${themeMode}${ext}`
    }
  }
  return icon
}

const generateUniqueEventsForMenu = (menus: MenuItem[]) => {
  const { t } = i18n.global
  const MenuItemHandlerMap: Recordable<() => void> = {}

  EventsOff('onMenuItemClick')
  EventsOn('onMenuItemClick', (id) => MenuItemHandlerMap[id]?.())

  let index = 0
  function processMenu(menu: MenuItem) {
    const _menu = { ...menu, text: t(menu.text || ''), tooltip: t(menu.tooltip || '') }
    const { event, children } = menu

    if (event) {
      _menu.event = index + '_' + menu.text
      MenuItemHandlerMap[_menu.event] = event as any
    }

    if (children && children.length > 0) {
      _menu.children = children.map(processMenu)
    }

    index += 1
    return _menu
  }

  return menus.map(processMenu)
}

const getTrayMenus = () => {
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()
  const pluginsStore = usePluginsStore()

  let pluginMenus: MenuItem[] = []
  let pluginMenusHidden = !appSettings.app.addPluginToMenu

  let groupMenus: MenuItem[] = []
  const groupMenusHidden = !appSettings.app.addGroupToMenu

  if (!groupMenusHidden) {
    const { proxies } = kernelApiStore
    if (!proxies) return []
    groupMenus = Object.values(proxies)
      .filter((v) => ['Selector', 'URLTest'].includes(v.type) && v.name !== 'GLOBAL')
      .concat(proxies.GLOBAL || [])
      .map((group) => {
        const all = (group.all || [])
          .filter((proxy) => {
            const history = proxies[proxy]?.history || []
            const alive = (history[history.length - 1]?.delay || 0) > 0
            return (
              appSettings.app.kernel.unAvailable ||
              ['direct', 'block'].includes(proxy) ||
              proxies[proxy]?.all ||
              alive
            )
          })
          .map((proxy) => {
            const history = proxies[proxy]?.history || []
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
              },
            }
          }),
        }
      })
  }

  if (!pluginMenusHidden) {
    const filtered = pluginsStore.plugins.filter(
      (plugin) => Object.keys(plugin.menus).length && !plugin.disabled,
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
            },
          }
        }),
      }
    })
  }

  const trayMenus: MenuItem[] = [
    {
      type: 'item',
      text: 'tray.showMainWindow',
      hidden: envStore.env.os === 'windows',
      event: ShowMainWindow,
    },
    {
      type: 'separator',
      hidden: envStore.env.os === 'windows',
    },
    {
      type: 'item',
      text: 'kernel.mode',
      hidden: !kernelApiStore.running,
      children: ModeOptions.map((mode) => ({
        type: 'item',
        text: mode.label,
        checked: kernelApiStore.config.mode === mode.value,
        event: () => handleChangeMode(mode.value),
      })),
    },
    {
      type: 'item',
      text: 'tray.proxyGroup',
      hidden: groupMenusHidden || !kernelApiStore.running,
      children: groupMenus,
    },
    {
      type: 'item',
      text: 'tray.kernel',
      children: [
        {
          type: 'item',
          text: 'tray.startKernel',
          hidden: kernelApiStore.running,
          event: kernelApiStore.startCore,
        },
        {
          type: 'item',
          text: 'tray.restartKernel',
          hidden: !kernelApiStore.running,
          event: kernelApiStore.restartCore,
        },
        {
          type: 'item',
          text: 'tray.stopKernel',
          hidden: !kernelApiStore.running,
          event: kernelApiStore.stopCore,
        },
      ],
    },
    {
      type: 'separator',
      hidden: !kernelApiStore.running,
    },
    {
      type: 'item',
      text: 'tray.proxy',
      hidden: !kernelApiStore.running,
      children: [
        {
          type: 'item',
          text: 'tray.setSystemProxy',
          hidden: envStore.systemProxy,
          event: envStore.setSystemProxy,
        },
        {
          type: 'item',
          text: 'tray.clearSystemProxy',
          hidden: !envStore.systemProxy,
          event: envStore.clearSystemProxy,
        },
      ],
    },
    {
      type: 'item',
      text: 'tray.tun',
      hidden: !kernelApiStore.running,
      children: [
        {
          type: 'item',
          text: 'tray.enableTunMode',
          hidden: kernelApiStore.config.tun.enable,
          event: () => kernelApiStore.updateConfig('tun', { enable: true }),
        },
        {
          type: 'item',
          text: 'tray.disableTunMode',
          hidden: !kernelApiStore.config.tun.enable,
          event: () => kernelApiStore.updateConfig('tun', { enable: false }),
        },
      ],
    },
    {
      type: 'item',
      text: 'settings.general',
      children: [
        {
          type: 'item',
          text: 'settings.theme.name',
          children: ThemeOptions.map((theme) => ({
            type: 'item',
            text: theme.label,
            checked: appSettings.app.theme === theme.value,
            event: () => (appSettings.app.theme = theme.value),
          })),
        },
        {
          type: 'item',
          text: 'settings.color.name',
          children: ColorOptions.map((color) => ({
            type: 'item',
            text: color.label,
            checked: appSettings.app.color === color.value,
            event: () => (appSettings.app.color = color.value),
          })),
        },
        {
          type: 'item',
          text: 'settings.lang.name',
          children: appSettings.locales.map((v) => ({
            type: 'item',
            text: v.label,
            checked: appSettings.app.lang === v.value,
            event: () => (appSettings.app.lang = v.value),
          })),
        },
      ],
    },
    {
      type: 'item',
      text: 'tray.plugins',
      hidden: pluginMenusHidden,
      children: pluginMenus,
    },
    {
      type: 'separator',
    },
    {
      type: 'item',
      text: 'tray.restart',
      tooltip: 'tray.restartTip',
      event: RestartApp,
    },
    {
      type: 'item',
      text: 'tray.exit',
      tooltip: 'tray.exitTip',
      event: exitApp,
    },
  ]

  return trayMenus
}

export const updateTrayMenus = debounce(async () => {
  const trayMenus = getTrayMenus()
  const trayIcons = getTrayIcons()
  const pluginsStore = usePluginsStore()

  const isDarwin = useEnvStore().env.os === 'darwin'
  const title = isDarwin ? '' : APP_TITLE

  const tray = { icon: trayIcons, title, tooltip: APP_TITLE + ' ' + APP_VERSION }

  const [finalTray, finalMenus] = await pluginsStore.onTrayUpdateTrigger(tray, trayMenus)

  await UpdateTray(finalTray)
  await UpdateTrayMenus(generateUniqueEventsForMenu(finalMenus) as any)
}, 500)
