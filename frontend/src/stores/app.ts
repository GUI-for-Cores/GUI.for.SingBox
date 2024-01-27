import { ref } from 'vue'
import { defineStore } from 'pinia'

import i18n from '@/lang'
import type { MenuItem } from '@/constant'
import { debounce, deepClone, ignoredError, sampleID } from '@/utils'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, usePluginsStore } from '@/stores'
import {
  EventsOff,
  EventsOn,
  UpdateTrayMenus,
  WindowHide,
  WindowShow,
  RestartApp,
  ExitApp
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

  /* Profiles Clipboard */
  const profilesClipboard = ref<any>()
  const setProfilesClipboard = (data: any) => {
    profilesClipboard.value = deepClone(data)
  }

  const getProfilesClipboard = () => {
    return deepClone(profilesClipboard.value)
  }

  const clearProfilesClipboard = () => {
    profilesClipboard.value = false
  }

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

    await ignoredError(pluginsStore.onShutdownTrigger)

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

  const updateTrayMenus = debounce(async () => {
    const envStore = useEnvStore()
    const appSettings = useAppSettingsStore()
    const kernelApiStore = useKernelApiStore()

    const trayMenus: MenuItem[] = [
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
            event: envStore.setSystemProxy
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

    await UpdateTrayMenus(processedMenus as any)
  }, 1000)

  return {
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    profilesClipboard,
    setProfilesClipboard,
    getProfilesClipboard,
    clearProfilesClipboard,
    updateTrayMenus,
    exitApp
  }
})
