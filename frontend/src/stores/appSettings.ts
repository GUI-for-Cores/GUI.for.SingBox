import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { parse, stringify } from 'yaml'

import {
  Readfile,
  Writefile,
  WindowSetSystemDefaultTheme,
  WindowIsMaximised,
  WindowIsMinimised,
} from '@/bridge'
import { Colors, DefaultFontFamily, DefaultTestURL, UserFilePath } from '@/constant/app'
import { DefaultConnections } from '@/constant/kernel'
import {
  Theme,
  WindowStartState,
  Lang,
  View,
  Color,
  WebviewGpuPolicy,
  ControllerCloseMode,
  Branch,
} from '@/enums/app'
import i18n from '@/lang'
import { debounce, updateTrayMenus, APP_TITLE, ignoredError, APP_VERSION } from '@/utils'

import type { AppSettings } from '@/types/app'

export const useAppSettingsStore = defineStore('app-settings', () => {
  let firstOpen = true
  let latestUserConfig = ''

  const themeMode = ref<Theme.Dark | Theme.Light>(Theme.Light)

  const app = ref<AppSettings>({
    lang: Lang.EN,
    theme: Theme.Auto,
    color: Color.Default,
    fontFamily: DefaultFontFamily,
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
    autoSetSystemProxy: true,
    autoStartKernel: false,
    userAgent: APP_TITLE + '/' + APP_VERSION,
    startupDelay: 30,
    connections: DefaultConnections(),
    kernel: {
      branch: Branch.Main,
      profile: '',
      pid: 0,
      running: false,
      autoClose: true,
      unAvailable: true,
      cardMode: true,
      sortByDelay: false,
      testUrl: DefaultTestURL,
      controllerCloseMode: ControllerCloseMode.All,
    },
    pluginSettings: {},
    githubApiToken: '',
    multipleInstance: false,
    addPluginToMenu: false,
    addGroupToMenu: false,
    rollingRelease: true,
    pages: ['Overview', 'Profiles', 'Subscriptions', 'Plugins'],
  })

  const saveAppSettings = debounce((config: string) => {
    Writefile(UserFilePath, config)
  }, 500)

  const setupAppSettings = async () => {
    const data = await ignoredError(Readfile, UserFilePath)
    data && (app.value = Object.assign(app.value, parse(data)))

    if ((app.value.kernel.branch as any) === 'latest') {
      app.value.kernel.branch = Branch.Alpha
    }
    if (app.value.kernel.controllerCloseMode === undefined) {
      app.value.kernel.controllerCloseMode = ControllerCloseMode.All
    }
    if (app.value.addGroupToMenu === undefined) {
      app.value.addGroupToMenu = false
    }
    // @ts-expect-error(Deprecated)
    if (app.value['font-family'] !== undefined) {
      // @ts-expect-error(Deprecated)
      app.value.fontFamily = app.value['font-family']
      // @ts-expect-error(Deprecated)
      delete app.value['font-family']
    }

    if (typeof app.value.connections.visibility['metadata.destinationIP'] === 'undefined') {
      app.value.connections.visibility['metadata.destinationIP'] = false
      app.value.connections.order.push('metadata.destinationIP')
      app.value.connections.order = app.value.connections.order.filter(
        (field) =>
          !['metadata.process', 'metadata.sniffHost', 'metadata.remoteDestination'].includes(field),
      )
    }

    firstOpen = !!data

    updateAppSettings(app.value)
  }

  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryList.addEventListener('change', ({ matches }) => {
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
    document.body.style.fontFamily = settings.fontFamily
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
    { deep: true },
  )

  window.addEventListener(
    'resize',
    debounce(async () => {
      const [isMinimised, isMaximised] = await Promise.all([
        WindowIsMinimised(),
        WindowIsMaximised(),
      ])
      if (!isMinimised && !isMaximised) {
        app.value.width = document.documentElement.clientWidth
        app.value.height = document.documentElement.clientHeight
      }
    }, 1000),
  )

  watch(
    [
      themeMode,
      () => app.value.color,
      () => app.value.lang,
      () => app.value.addPluginToMenu,
      () => app.value.kernel.running,
    ],
    updateTrayMenus,
  )

  watch(themeMode, setAppTheme, { immediate: true })

  return { setupAppSettings, app, themeMode }
})
