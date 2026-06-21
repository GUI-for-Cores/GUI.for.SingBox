import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { parse, stringify } from 'yaml'

import {
  GetSystemProxyBypass,
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
  DefaultPluginHubSources,
  DefaultTestTimeout,
  DefaultTestURL,
  UserFilePath,
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
  RequestProxyMode,
} from '@/enums/app'
import i18n, { loadLocale } from '@/lang'
import { useAppStore, useEnvStore } from '@/stores'
import { debounce, updateTrayAndMenus, ignoredError, deepClone, message } from '@/utils'

import type { AppSettings } from '@/types/app'

export const useAppSettingsStore = defineStore('app-settings', () => {
  const appStore = useAppStore()
  const envStore = useEnvStore()

  let latestUserSettings: string

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
    contentProtection: false,
    width: 0,
    height: 0,
    exitOnClose: true,
    closeKernelOnExit: true,
    autoSetSystemProxy: true,
    autoSetSystemDNS: false,
    requestProxyMode: RequestProxyMode.System,
    customProxy: '',
    proxyBypassList: '',
    systemProxyServices: [],
    systemProxyDNS: '',
    systemDefaultDNS: '',
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
      testTimeout: DefaultTestTimeout,
      concurrencyLimit: DefaultConcurrencyLimit,
      controllerCloseMode: ControllerCloseMode.All,
      controllerSensitivity: DefaultControllerSensitivity,
      main: undefined as any,
      alpha: undefined as any,
    },
    plugins: {
      sources: DefaultPluginHubSources(),
    },
    pluginSettings: {},
    githubApiToken: '',
    githubDownloadAcceleration: false,
    githubDownloadMirror: '',
    multipleInstance: false,
    addPluginToMenu: false,
    addGroupToMenu: false,
    rollingRelease: true,
    debugOutline: false,
    debugNoAnimation: false,
    debugNoRounded: false,
    debugBorder: false,
    debugUsePointer: false,
    pages: ['Overview', 'Profiles', 'Subscriptions', 'Plugins'],
  })

  const saveAppSettings = debounce((config: string) => {
    WriteFile(UserFilePath, config)
  }, 500)

  const setupAppSettings = async () => {
    const data = await ignoredError(ReadFile, UserFilePath)
    let settings: AppSettings
    if (data) {
      settings = parse(data)
    } else {
      settings = deepClone(app.value)
    }

    await appStore.loadLocales(false, false)

    if (!settings.kernel.main) {
      settings.kernel.main = DefaultCoreConfig()
      settings.kernel.alpha = DefaultCoreConfig()
    }
    if (!settings.proxyBypassList) {
      settings.proxyBypassList = (await ignoredError(GetSystemProxyBypass)) || ''
    }
    if ('darwinSystemProxyServices' in settings) {
      settings.systemProxyServices = settings.darwinSystemProxyServices as string[]
      delete settings.darwinSystemProxyServices
    }
    const defaultSystemProxyServices = envStore.env.os === 'darwin' ? ['Ethernet', 'Wi-Fi'] : []
    if (!data) {
      settings.systemProxyServices = defaultSystemProxyServices
    } else if (!settings.systemProxyServices) {
      settings.systemProxyServices = defaultSystemProxyServices
    } else if (
      envStore.env.os === 'linux' &&
      settings.systemProxyServices.join(',') === 'Ethernet,Wi-Fi'
    ) {
      settings.systemProxyServices = defaultSystemProxyServices
    }
    if (settings.autoSetSystemDNS === undefined) {
      settings.autoSetSystemDNS = false
    }
    if (settings.systemProxyDNS === undefined) {
      settings.systemProxyDNS = ''
    }
    if (settings.systemDefaultDNS === undefined) {
      settings.systemDefaultDNS = ''
    }
    if (!settings.requestProxyMode) {
      settings.requestProxyMode = RequestProxyMode.System
    }
    if (settings.customProxy === undefined) {
      settings.customProxy = ''
    }
    if (settings.githubDownloadAcceleration === undefined) {
      settings.githubDownloadAcceleration = false
    }
    if (settings.githubDownloadMirror === undefined) {
      settings.githubDownloadMirror = ''
    }
    if (!settings.plugins) {
      settings.plugins = {
        sources: DefaultPluginHubSources(),
      }
    }
    if (settings.debugUsePointer === undefined) {
      settings.debugUsePointer = false
    }

    app.value = settings
    latestUserSettings = stringify(app.value)
  }

  const applyAppSettings = {
    theme(theme: Theme) {
      const isAuto = theme === Theme.Auto
      if (isAuto) {
        themeMode.value = mediaQueryList.matches ? Theme.Dark : Theme.Light
      } else {
        themeMode.value = theme
      }
    },
    lang(lang: string) {
      i18n.global.locale.value = lang
      if (!i18n.global.availableLocales.includes(lang)) {
        loadLocale(lang)
      }
    },
    color(color: Color, primary: string, secondary: string) {
      if (color !== Color.Custom) {
        ;({ primary, secondary } = Colors[color] ?? { primary, secondary })
      }
      document.documentElement.style.setProperty('--primary-color', primary)
      document.documentElement.style.setProperty('--secondary-color', secondary)
    },
    feature(
      outline: boolean,
      noAnimation: boolean,
      noRounded: boolean,
      border: boolean,
      usePointer: boolean,
    ) {
      document.body.setAttribute('feature-outline', String(outline))
      document.body.setAttribute('feature-no-animation', String(noAnimation))
      document.body.setAttribute('feature-no-rounded', String(noRounded))
      document.body.setAttribute('feature-border', String(border))
      document.body.setAttribute('feature-use-pointer', String(usePointer))
    },
    fontFamily(fontFamily: string) {
      document.body.style.fontFamily = fontFamily
    },
    windowSize(width: number, height: number) {
      app.value.width = width
      app.value.height = height
    },
    systemProxyBypass() {
      if (envStore.systemProxy) {
        envStore.setSystemProxy().catch((err) => message.error(err))
      }
    },
    systemDNS() {
      if (app.value.autoSetSystemDNS) {
        envStore.setSystemDNS(envStore.systemDNSSet).catch((err) => message.error(err))
      }
    },
  }

  /* Apply AppSettings */
  const onAppSettingsChange = (settings: AppSettings) => {
    applyAppSettings.theme(settings.theme)
    applyAppSettings.color(settings.color, settings.primaryColor, settings.secondaryColor)
    applyAppSettings.lang(settings.lang)
    applyAppSettings.fontFamily(settings.fontFamily)
    applyAppSettings.feature(
      settings.debugOutline,
      settings.debugNoAnimation,
      settings.debugNoRounded,
      settings.debugBorder,
      settings.debugUsePointer,
    )
    const lastModifiedSettings = stringify(settings)
    if (latestUserSettings !== lastModifiedSettings) {
      saveAppSettings(lastModifiedSettings).then(() => {
        latestUserSettings = lastModifiedSettings
      })
    } else {
      saveAppSettings.cancel()
    }
  }
  watch(app, onAppSettingsChange, { deep: true })

  /* Apply AppTheme */
  const themeMode = ref<Theme.Light | Theme.Dark>(Theme.Light)
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
  watch(themeMode, setAppTheme, { immediate: true })

  /* Apply WindowSize */
  const onWindowSizeChange = debounce(async () => {
    const [isMinimised, isMaximised] = await Promise.all([WindowIsMinimised(), WindowIsMaximised()])
    if (!isMinimised && !isMaximised) {
      const w = document.documentElement.clientWidth
      const h = document.documentElement.clientHeight
      applyAppSettings.windowSize(w, h)
    }
  }, 1000)
  window.addEventListener('resize', onWindowSizeChange)

  /* Apply TrayAndMenus */
  watch(
    [
      themeMode,
      appStore.locales,
      () => app.value.color,
      () => app.value.lang,
      () => app.value.addPluginToMenu,
    ],
    updateTrayAndMenus,
  )

  /* Apply SystemProxyBypass */
  const setSystemProxyBypass = debounce(() => {
    applyAppSettings.systemProxyBypass()
  }, 3000)
  watch(() => [app.value.proxyBypassList, app.value.systemProxyServices], setSystemProxyBypass)

  /* Apply SystemDNS */
  const setSystemDNS = debounce(() => {
    applyAppSettings.systemDNS()
  }, 3000)
  watch(
    () => [app.value.systemProxyServices, app.value.systemProxyDNS, app.value.systemDefaultDNS],
    setSystemDNS,
  )

  return { setupAppSettings, app, themeMode }
})
