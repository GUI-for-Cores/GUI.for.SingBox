import * as App from '@wails/go/bridge/App'

export const RestartApp = App.RestartApp

export const ExitApp = App.ExitApp

export const ShowMainWindow = App.ShowMainWindow

export const UpdateTray = async (tray: TrayContent) => {
  const { icon = '', title = '', tooltip = '' } = tray
  await App.UpdateTray({ icon, title, tooltip })
}

export const UpdateTrayMenus = App.UpdateTrayMenus

export const Notify = async (title: string, message: string, icon = '') => {
  const icons: Record<string, string> = {
    success: 'data/.cache/imgs/notify_success.png',
    error: 'data/.cache/imgs/notify_error.png'
  }
  await App.Notify(title, message, icons[icon] || 'data/.cache/imgs/tray_normal_dark.png')
}

export const GetEnv = App.GetEnv

export const IsStartup = App.IsStartup

export const GetInterfaces = async () => {
  const { flag, data } = await App.GetInterfaces()
  if (!flag) {
    throw data
  }
  return data.split('|')
}
