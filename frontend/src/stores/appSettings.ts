import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'

import i18n from '@/lang'
import { debounce, updateTrayMenus, APP_TITLE, ignoredError } from '@/utils'
import { Colors, DefaultFontFamily } from '@/constant/app'
import { Theme, WindowStartState, Lang, View, Color, WebviewGpuPolicy } from '@/enums/app'
import {
  Readfile,
  Writefile,
  WindowSetSystemDefaultTheme,
  WindowIsMaximised,
  WindowIsMinimised
} from '@/bridge'

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
  webviewGpuPolicy: WebviewGpuPolicy
  width: number
  height: number
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
    testUrl: string
  }
  pluginSettings: Record<string, Record<string, any>>
  githubApiToken: string
  multipleInstance: boolean
  addPluginToMenu: boolean
  rollingRelease: boolean
  pages: string[]
}

export const useAppSettingsStore = defineStore('app-settings', () => {
  let firstOpen = true
  let latestUserConfig = ''

  const themeMode = ref<Theme.Dark | Theme.Light>(Theme.Light)

  const app = ref<AppSettings>({
    lang: Lang.EN,
    theme: Theme.Auto,
    color: Color.Default,
    'font-family': DefaultFontFamily,
    profilesView: View.Grid,
    subscribesView: View.Grid,
    rulesetsView: View.Grid,
    pluginsView: View.Grid,
    scheduledtasksView: View.Grid,
    windowStartState: WindowStartState.Normal,
    webviewGpuPolicy: WebviewGpuPolicy.OnDemand,
    width: 0,
    height: 0,
    exitOnClose: true,
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
      sortByDelay: false,
      testUrl: 'https://www.gstatic.com/generate_204'
    },
    pluginSettings: {},
    githubApiToken: '',
    multipleInstance: false,
    addPluginToMenu: false,
    rollingRelease: false,
    pages: ['Overview', 'Profiles', 'Subscriptions', 'Plugins']
  })

  const saveAppSettings = debounce((config: string) => {
    console.log('save app settings')
    Writefile('data/user.yaml', config)
  }, 1500)

  const setupAppSettings = async () => {
    const data = await ignoredError(Readfile, 'data/user.yaml')
    data && (app.value = Object.assign(app.value, parse(data)))

    // compatibility code
    app.value.pages = app.value.pages ?? ['Overview', 'Profiles', 'Subscriptions', 'Plugins']

    firstOpen = !!data

    updateAppSettings(app.value)
  }

  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryList.addEventListener('change', ({ matches }) => {
    console.log('onSystemThemeChange')
    if (app.value.theme === Theme.Auto) {
      themeMode.value = matches ? Theme.Dark : Theme.Light
    }
  })

  const setAppTheme = (theme: Theme.Dark | Theme.Light) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        document.body.setAttribute('theme-mode', theme)
      })
    } else {
      document.body.setAttribute('theme-mode', theme)
    }
    WindowSetSystemDefaultTheme()
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

  window.addEventListener(
    'resize',
    debounce(async () => {
      const isMinimised = await WindowIsMinimised()
      const isMaximised = await WindowIsMaximised()
      if (!isMinimised && !isMaximised) {
        app.value.width = document.documentElement.clientWidth
        app.value.height = document.documentElement.clientHeight
      }
    }, 1000)
  )

  watch(
    [
      themeMode,
      () => app.value.color,
      () => app.value.lang,
      () => app.value.addPluginToMenu,
      () => app.value.kernel.running,
      () => app.value.kernel.unAvailable,
      () => app.value.kernel.sortByDelay
    ],
    updateTrayMenus
  )

  watch(themeMode, setAppTheme, { immediate: true })

  return { setupAppSettings, app, themeMode }
})
