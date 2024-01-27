import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { MenuItem } from '@/constant'
import { deepClone, ignoredError, sampleID } from '@/utils'
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

  /* System Tray & Menus */
  const exitApp = async () => {
    const envStore = useEnvStore()
    const pluginsStore = usePluginsStore()
    const appSettings = useAppSettingsStore()
    const kernelApiStore = useKernelApiStore()

    const { autoClose, running } = appSettings.app.kernel
    if (autoClose && running) {
      await kernelApiStore.stopKernel()
      if (appSettings.app.closeKernelOnExit) {
        envStore.clearSystemProxy()
      }
    }

    const timer = setTimeout(() => {
      ExitApp()
    }, 3_000)

    await ignoredError(pluginsStore.onShutdownTrigger)

    clearTimeout(timer)

    ExitApp()
  }

  const defaultTrayMenus: MenuItem[] = [
    {
      type: 'item',
      text: 'tray.show',
      tooltip: 'tray.showTip',
      event: WindowShow
    },
    {
      type: 'item',
      text: 'tray.hide',
      tooltip: 'tray.hideTip',
      event: WindowHide
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

  const menuEvents: string[] = []

  const setupTrayMenus = async () => {
    await updateTrayMenus([])
  }

  const updateTrayMenus = async (trayMenus: MenuItem[]) => {
    menuEvents.forEach((event) => EventsOff(event))
    menuEvents.splice(0)

    const separator: MenuItem[] =
      trayMenus.length === 0
        ? []
        : [
            {
              type: 'separator'
            }
          ]

    const menus = [...trayMenus, ...separator, ...defaultTrayMenus].map((menu) => {
      const _menu = { ...menu }
      const handler = menu.event
      if (handler) {
        const event = sampleID()
        _menu.event = event
        menuEvents.push(event)
        EventsOn(event, handler as any)
      }
      return _menu
    })
    await UpdateTrayMenus(menus)
  }

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
    setupTrayMenus,
    updateTrayMenus,
    exitApp
  }
})
