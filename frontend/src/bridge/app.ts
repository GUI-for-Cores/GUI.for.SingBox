import * as App from '@wails/go/bridge/App'
import type { TrayContent } from '@/constant'

export * from '@wails/runtime/runtime'

export const RestartApp = App.RestartApp

export const ExitApp = App.ExitApp

export const UpdateTrayMenus = App.UpdateTrayMenus

export const UpdateTray = async (tray: TrayContent) => {
  const { icon = '', title = '', tooltip = '' } = tray
  await App.UpdateTray({ icon, title, tooltip })
}

export const Notify = async (title: string, message: string, icon = '') => {
  const icons: Record<string, string> = {
    success: 'data/.cache/imgs/notify_success.png',
    error: 'data/.cache/imgs/notify_error.png'
  }
  await App.Notify(title, message, icons[icon] || 'data/.cache/imgs/notify_normal.ico')
}
