import { onUnmounted } from 'vue'

import { EventsOn, WindowHide } from '@/bridge'
import * as Stores from '@/stores'
import { exitApp, message, modal, sampleID } from '@/utils'

import { CommandView } from '@/components'

export const useAppLifecycle = () => {
  const appStore = Stores.useAppStore()
  const appSettings = Stores.useAppSettingsStore()
  const subscribesStore = Stores.useSubscribesStore()
  let commandModal: ReturnType<typeof modal> | undefined

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
    if (((event.ctrlKey && event.shiftKey) || event.metaKey) && event.code === 'KeyP') {
      event.preventDefault()
      if (event.repeat || commandModal) return

      const m = modal({
        title: 'commands.title',
        maskClosable: true,
        height: '90',
        px: 0,
        py: 0,
        submit: false,
        toolbar: {
          maximize: false,
          minimize: false,
        },
        afterDestroy() {
          commandModal = undefined
        },
      })
      commandModal = m
      m.setContent(CommandView, { close: () => m.close() }).open()
      return
    }

    if (event.key === 'Escape') {
      const closeFn = appStore.modalStack.at(-1)
      closeFn?.()
    }
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    offLaunchApp()
    offBeforeExitApp()
    offExitApp()
    window.removeEventListener('keydown', handleKeydown)
  })
}
