import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'

import i18n from '@/lang'
import { debounce, updateTrayMenus, APP_TITLE, deepClone } from '@/utils'
import { Theme, WindowStartState, Lang, View, Color, Colors } from '@/constant'
import { WindowSetDarkTheme, WindowSetLightTheme, Readfile, Writefile } from '@/utils/bridge'

type AppSettings = {
  lang: Lang
  theme: Theme
  color: Color
  'font-family': string
  profilesView: View
  subscribesView: View
  rulesetsView: View
  pluginsView: View
  scheduledtasksView: View
  windowStartState: WindowStartState
  exitOnClose: boolean
  closeKernelOnExit: boolean
  autoSetSystemProxy: boolean
  autoStartKernel: boolean
  userAgent: string
  startupDelay: number
  connections: {
    visibility: Record<string, boolean>
    order: string[]
  }
  kernel: {
    branch: 'main' | 'latest'
    profile: string
    pid: number
    running: boolean
    autoClose: boolean
    unAvailable: boolean
    cardMode: boolean
    sortByDelay: boolean
  }
}

export const useAppSettingsStore = defineStore('app-settings', () => {
  let firstOpen = true
  let latestUserConfig = ''

  const themeMode = ref<Theme.Dark | Theme.Light>(Theme.Light)

  const app = ref<AppSettings>({
    lang: Lang.EN,
    theme: Theme.Auto,
    color: Color.Default,
    'font-family': '"Microsoft Yahei", "Arial", sans-serif, "Twemoji Mozilla"',
    profilesView: View.Grid,
    subscribesView: View.Grid,
    rulesetsView: View.Grid,
    pluginsView: View.Grid,
    scheduledtasksView: View.Grid,
    windowStartState: WindowStartState.Normal,
    exitOnClose: false,
    closeKernelOnExit: true,
    autoSetSystemProxy: false,
    autoStartKernel: false,
    userAgent: APP_TITLE,
    startupDelay: 30,
    connections: {
      visibility: {
        'metadata.type': true,
        'metadata.process': false,
        'metadata.processPath': false,
        'metadata.host': true,
        'metadata.sniffHost': false,
        'metadata.sourceIP': false,
        'metadata.remoteDestination': false,
        rule: true,
        chains: true,
        up: true,
        down: true,
        upload: true,
        download: true,
        start: true
      },
      order: [
        'metadata.type',
        'metadata.process',
        'metadata.processPath',
        'metadata.host',
        'metadata.sniffHost',
        'metadata.sourceIP',
        'metadata.remoteDestination',
        'rule',
        'chains',
        'up',
        'down',
        'upload',
        'download',
        'start'
      ]
    },
    kernel: {
      branch: 'main',
      profile: '',
      pid: 0,
      running: false,
      autoClose: true,
      unAvailable: true,
      cardMode: true,
      sortByDelay: false
    }
  })

  const saveAppSettings = debounce((config: string) => {
    console.log('save app settings')
    Writefile('data/user.yaml', config)
  }, 1500)

  const setupAppSettings = async () => {
    try {
      const b = await Readfile('data/user.yaml')

      const defaultSettings = deepClone(app.value)

      app.value = Object.assign(app.value, parse(b))

      if (app.value.connections.order.length !== defaultSettings.connections.order.length) {
        app.value.connections = defaultSettings.connections
      }
    } catch (error) {
      firstOpen = false
      console.log(error)
    }

    updateAppSettings(app.value)
  }

  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryList.addEventListener('change', ({ matches }) => {
    console.log('onSystemThemeChange')
    if (app.value.theme === Theme.Auto) {
      themeMode.value = matches ? Theme.Dark : Theme.Light
      setAppTheme(themeMode.value)
    }
  })

  const setAppTheme = (theme: Theme.Dark | Theme.Light) => {
    document.body.setAttribute('theme-mode', theme)
    if (theme === Theme.Dark) WindowSetDarkTheme()
    else WindowSetLightTheme()
  }

  const updateAppSettings = (settings: AppSettings) => {
    i18n.global.locale.value = settings.lang
    themeMode.value =
      settings.theme === Theme.Auto
        ? mediaQueryList.matches
          ? Theme.Dark
          : Theme.Light
        : settings.theme
    const { primary, secondary } = Colors[settings.color]
    document.documentElement.style.setProperty('--primary-color', primary)
    document.documentElement.style.setProperty('--secondary-color', secondary)
    document.body.style.fontFamily = settings['font-family']
    setAppTheme(themeMode.value)
  }

  watch(
    app,
    (settings) => {
      updateAppSettings(settings)

      if (!firstOpen) {
        const lastModifiedConfig = stringify(settings)
        if (latestUserConfig !== lastModifiedConfig) {
          saveAppSettings(lastModifiedConfig).then(() => {
            latestUserConfig = lastModifiedConfig
          })
        } else {
          saveAppSettings.cancel()
        }
      }

      firstOpen = false
    },
    { deep: true }
  )

  watch(
    [
      themeMode,
      () => app.value.color,
      () => app.value.lang,
      () => app.value.kernel.running,
      () => app.value.kernel.unAvailable,
      () => app.value.kernel.sortByDelay
    ],
    updateTrayMenus
  )

  return { setupAppSettings, app, themeMode }
})
