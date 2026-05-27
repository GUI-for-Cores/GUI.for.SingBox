import { onUnmounted } from 'vue'

import { EventsOn, WindowHide } from '@/bridge'
import * as Stores from '@/stores'
import { exitApp, message, sampleID } from '@/utils'

export const useAppLifecycle = () => {
  const appStore = Stores.useAppStore()
  const appSettings = Stores.useAppSettingsStore()
  const subscribesStore = Stores.useSubscribesStore()

  const offLaunchApp = EventsOn('onLaunchApp', async ([arg]: string[]) => {
    if (!arg) return

    let _url
    let _name = sampleID()

    const url = new URL(arg)
    if (url.pathname === '//install-config/') {
      _url = url.searchParams.get('url')
      _name = url.searchParams.get('name') || sampleID()
    } else if (url.pathname.startsWith('//import-remote-profile')) {
      _url = url.searchParams.get('url')
      _name = decodeURIComponent(url.hash).slice(1) || sampleID()
    }

    if (!_url) {
      message.error('URL missing')
      return
    }

    try {
      await subscribesStore.importSubscribe(_name, _url)
      message.success('common.success')
    } catch (error) {
      message.error(error)
    }
  })

  const offBeforeExitApp = EventsOn('onBeforeExitApp', async () => {
    if (appSettings.app.exitOnClose) {
      exitApp()
      return
    }

    WindowHide()
  })

  const offExitApp = EventsOn('onExitApp', () => exitApp())

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return

    const closeFn = appStore.modalStack.at(-1)
    closeFn?.()
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    offLaunchApp()
    offBeforeExitApp()
    offExitApp()
    window.removeEventListener('keydown', handleKeydown)
  })
}
