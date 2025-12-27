import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { parse, stringify } from 'yaml'

import {
  ReadDir,
  ReadFile,
  WriteFile,
  WindowSetSystemDefaultTheme,
  WindowIsMaximised,
  WindowIsMinimised,
} from '@/bridge'
import {
  Colors,
  DefaultCardColumns,
  DefaultConcurrencyLimit,
  DefaultControllerSensitivity,
  DefaultFontFamily,
  DefaultTestURL,
  UserFilePath,
  LocalesFilePath,
} from '@/constant/app'
import { DefaultConnections, DefaultCoreConfig } from '@/constant/kernel'
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
import i18n, { loadLocaleMessages, reloadLocale } from '@/lang'
import { debounce, updateTrayMenus, ignoredError, sleep, GetSystemProxyBypass } from '@/utils'

import { useEnvStore } from './env'

import type { AppSettings } from '@/types/app'

export const useAppSettingsStore = defineStore('app-settings', () => {
  const themeMode = ref<Theme.Dark | Theme.Light>(Theme.Light)

  const envStore = useEnvStore()

  const app = ref<AppSettings>({
    lang: Lang.EN,
    theme: Theme.Auto,
    color: Color.Default,
    primaryColor: '#000',
    secondaryColor: '#545454',
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
    proxyBypassList: '',
    autoStartKernel: false,
    autoRestartKernel: false,
    userAgent: '',
    startupDelay: 30,
    connections: DefaultConnections(),
    kernel: {
      realMemoryUsage: false,
      branch: Branch.Main,
      profile: '',
      autoClose: true,
      unAvailable: true,
      cardMode: true,
      cardColumns: DefaultCardColumns,
      sortByDelay: false,
      testUrl: DefaultTestURL,
      concurrencyLimit: DefaultConcurrencyLimit,
      controllerCloseMode: ControllerCloseMode.All,
      controllerSensitivity: DefaultControllerSensitivity,
      main: DefaultCoreConfig(),
      alpha: DefaultCoreConfig(),
    },
    pluginSettings: {},
    githubApiToken: '',
    multipleInstance: false,
    addPluginToMenu: false,
    addGroupToMenu: false,
    rollingRelease: true,
    debugOutline: false,
    debugNoAnimation: false,
    debugNoRounded: false,
    debugBorder: false,
    pages: ['Overview', 'Profiles', 'Subscriptions', 'Plugins'],
  })

  const saveAppSettings = debounce((config: string) => {
    WriteFile(UserFilePath, config)
  }, 500)

  const localesLoading = ref(false)
  const locales = ref<{ label: string; value: string }[]>([])
  const loadLocales = async (delay = true, reload = true) => {
    localesLoading.value = true
    locales.value = [
      {
        label: 'settings.lang.zh',
        value: Lang.ZH,
      },
      {
        label: 'settings.lang.en',
        value: Lang.EN,
      },
    ]
    const dirs = await ignoredError(ReadDir, LocalesFilePath)
    if (dirs) {
      const files = dirs.flatMap((file) => {
        if (file.isDir) return []
        const [name, ext] = file.name.split('.')
        return name && ext === 'json' ? { label: name, value: name } : []
      })
      locales.value.push(...files)
    }
    reload && (await reloadLocale())
    delay && (await sleep(200))
    localesLoading.value = false
  }

  let latestUserSettings: string

  const setupAppSettings = async () => {
    const data = await ignoredError(ReadFile, UserFilePath)
    if (data) {
      const settings = parse(data)
      latestUserSettings = stringify(settings)
      app.value = Object.assign(app.value, settings)
    } else {
      latestUserSettings = ''
    }

    await loadLocales(false, false)

    if (!app.value.proxyBypassList) {
      app.value.proxyBypassList = await GetSystemProxyBypass()
    }
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
    loadLocaleMessages(settings.lang)
    i18n.global.locale.value = settings.lang
    themeMode.value =
      settings.theme === Theme.Auto
        ? mediaQueryList.matches
          ? Theme.Dark
          : Theme.Light
        : settings.theme
    let primary, secondary
    if (settings.color === Color.Custom) {
      ;({ primaryColor: primary, secondaryColor: secondary } = settings)
    } else {
      ;({ primary, secondary } = Colors[settings.color] ?? { primary: '', secondary: '' })
    }
    document.documentElement.style.setProperty('--primary-color', primary)
    document.documentElement.style.setProperty('--secondary-color', secondary)
    document.body.style.fontFamily = settings.fontFamily
    document.body.setAttribute('debug-outline', String(settings.debugOutline))
    document.body.setAttribute('debug-no-animation', String(settings.debugNoAnimation))
    document.body.setAttribute('debug-no-rounded', String(settings.debugNoRounded))
    document.body.setAttribute('debug-border', String(settings.debugBorder))
  }

  watch(
    app,
    (settings) => {
      updateAppSettings(settings)

      const lastModifiedSettings = stringify(settings)
      if (latestUserSettings !== undefined && latestUserSettings !== lastModifiedSettings) {
        saveAppSettings(lastModifiedSettings).then(() => {
          latestUserSettings = lastModifiedSettings
        })
      } else {
        saveAppSettings.cancel()
      }
    },
    { deep: true, immediate: true },
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
      locales,
      () => app.value.color,
      () => app.value.lang,
      () => app.value.addPluginToMenu,
    ],
    updateTrayMenus,
  )

  watch(themeMode, setAppTheme, { immediate: true })

  const setSystemProxy = debounce(() => envStore.systemProxy && envStore.setSystemProxy(), 3000)

  watch(() => app.value.proxyBypassList, setSystemProxy)

  return { setupAppSettings, app, themeMode, locales, localesLoading, loadLocales }
})
