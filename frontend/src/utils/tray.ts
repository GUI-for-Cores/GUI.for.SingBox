import { UpdateTray } from '@/bridge'
import { debounce, APP_TITLE, APP_VERSION } from '@/utils'
import { useAppSettingsStore, useKernelApiStore, useEnvStore } from '@/stores'

const getTrayIcons = () => {
  const envStore = useEnvStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  const themeMode = appSettings.themeMode
  let icon = `data/.cache/icons/tray_normal_${themeMode}.ico`

  if (appSettings.app.kernel.running) {
    if (kernelApiStore.config.tun.enable) {
      icon = `data/.cache/icons/tray_tun_${themeMode}.ico`
    } else if (envStore.systemProxy) {
      icon = `data/.cache/icons/tray_proxy_${themeMode}.ico`
    }
  }
  return icon
}

export const updateTrayMenus = debounce(async () => {
  const trayIcons = getTrayIcons()
  await UpdateTray({ icon: trayIcons, title: APP_TITLE, tooltip: APP_TITLE + ' ' + APP_VERSION })
}, 500)
