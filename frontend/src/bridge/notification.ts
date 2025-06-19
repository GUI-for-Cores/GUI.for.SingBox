import * as App from '@wails/go/bridge/App'

import { APP_TITLE } from '@/utils'

interface NotifyOptions {
  AppName?: string
  Beep?: boolean
}

export const Notify = async (
  title: string,
  message: string,
  icon = '',
  options: NotifyOptions = {},
) => {
  const _options: Required<NotifyOptions> = { AppName: APP_TITLE, Beep: true, ...options }
  const icons: Record<string, string> = {
    success: 'data/.cache/imgs/notify_success.png',
    error: 'data/.cache/imgs/notify_error.png',
  }
  const { flag, data } = await App.Notify(
    title,
    message,
    icons[icon] || 'data/.cache/imgs/tray_normal_dark.png',
    _options,
  )
  if (!flag) {
    throw data
  }
  return data
}
