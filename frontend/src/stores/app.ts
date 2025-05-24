import { useI18n } from 'vue-i18n'
import { h, computed, ref, type VNode, isVNode, resolveComponent } from 'vue'
import { defineStore } from 'pinia'

import { useEnvStore } from './env'
import {
  APP_TITLE,
  APP_VERSION,
  APP_VERSION_API,
  getGitHubApiAuthorization,
  ignoredError,
  message,
  alert,
} from '@/utils'
import {
  Download,
  HttpGet,
  BrowserOpenURL,
  Movefile,
  UnzipZIPFile,
  Makedir,
  Removefile,
  AbsolutePath,
  HttpCancel,
} from '@/bridge'

export const useAppStore = defineStore('app', () => {
  /* Global Menu */
  const menuShow = ref(false)
  const menuList = ref<Menu[]>([])
  const menuPosition = ref({
    x: 0,
    y: 0,
  })

  /* Global Tips */
  const tipsShow = ref(false)
  const tipsMessage = ref('')
  const tipsPosition = ref({
    x: 0,
    y: 0,
  })

  /* Actions */
  interface CustomAction {
    component: string
    componentProps?: Recordable
    componentSlots?: Recordable
  }
  interface CustomActionSlotOptions {
    h: typeof h
    ref: typeof ref
  }
  type CustomActionSlot =
    | ((options: CustomActionSlotOptions) => VNode | string | number | boolean)
    | VNode
    | string
    | number
    | boolean
  const customActions: { [key: string]: CustomAction[] } = {
    core_state: [],
  }
  const addCustomActions = (target: string, actions: CustomAction | CustomAction[]) => {
    if (!customActions[target]) throw new Error('Target does not exist: ' + target)
    const _actions = Array.isArray(actions) ? actions : [actions]
    customActions[target].push(..._actions)
    const remove = () => {
      customActions[target] = customActions[target].filter((a) => !_actions.includes(a))
    }
    return remove
  }
  const renderCustomActionSlot = (slot: CustomActionSlot) => {
    let result: CustomActionSlot = slot
    if (typeof result === 'function') {
      const customH = (type: any, ...args: any[]) => h(resolveComponent(type), ...args)
      result = result({ h: customH, ref })
    }
    if (isVNode(result)) {
      return result
    }
    return h('div', result)
  }

  const { t } = useI18n()
  const envStore = useEnvStore()

  /* About Page */
  const showAbout = ref(false)
  const checkForUpdatesLoading = ref(false)
  const restartable = ref(false)
  const downloading = ref(false)
  const downloadUrl = ref('')
  const remoteVersion = ref(APP_VERSION)
  const updatable = computed(() => downloadUrl.value && APP_VERSION !== remoteVersion.value)

  const downloadApp = async () => {
    downloading.value = true
    try {
      const downloadCacheFile = 'data/.cache/gui.zip'
      const downloadCancelId = downloadCacheFile

      const { update, destroy } = message.info('common.downloading', 10 * 60 * 1_000, () => {
        HttpCancel(downloadCancelId)
        setTimeout(() => Removefile(downloadCacheFile), 1000)
      })

      await Makedir('data/.cache')
      await Download(
        downloadUrl.value,
        downloadCacheFile,
        undefined,
        (progress, total) => {
          update(t('common.downloading') + ((progress / total) * 100).toFixed(2) + '%')
        },
        {
          CancelId: downloadCancelId,
        },
      ).finally(destroy)

      const { appName, os } = envStore.env
      if (os !== 'darwin') {
        await Movefile(appName, appName + '.bak')
        await UnzipZIPFile(downloadCacheFile, '.')
        const suffix = { windows: '.exe', linux: '' }[os]
        await Movefile(APP_TITLE + suffix, appName)
        message.success('about.updateSuccessfulRestart')
        restartable.value = true
      } else {
        await UnzipZIPFile(downloadCacheFile, 'data')
        alert('common.success', 'about.updateSuccessfulReplace')
        BrowserOpenURL(await AbsolutePath('data'))
      }

      await Removefile(downloadCacheFile)
      await ignoredError(Removefile, 'data/rolling-release')
    } catch (error: any) {
      console.log(error)
      message.error(error.message || error, 5_000)
    }
    downloading.value = false
  }

  const checkForUpdates = async (showTips = false) => {
    if (checkForUpdatesLoading.value || downloading.value) return
    checkForUpdatesLoading.value = true
    remoteVersion.value = APP_VERSION
    try {
      const { body } = await HttpGet<Record<string, any>>(APP_VERSION_API, {
        Authorization: getGitHubApiAuthorization(),
      })
      if (body.message) throw body.message

      const { tag_name, assets } = body

      const { os, arch } = envStore.env
      const assetName = `${APP_TITLE}-${os}-${arch}.zip`

      const asset = assets.find((v: any) => v.name === assetName)
      if (!asset) throw 'Asset Not Found:' + assetName

      remoteVersion.value = tag_name
      downloadUrl.value = asset.browser_download_url

      if (showTips) {
        message.info(updatable.value ? 'about.newVersion' : 'about.latestVersion')
      }
    } catch (error: any) {
      console.error(error)
      message.error(error.message || error)
    }
    checkForUpdatesLoading.value = false
  }

  return {
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    showAbout,
    checkForUpdatesLoading,
    restartable,
    downloading,
    remoteVersion,
    updatable,
    checkForUpdates,
    downloadApp,
    customActions,
    addCustomActions,
    renderCustomActionSlot,
  }
})
