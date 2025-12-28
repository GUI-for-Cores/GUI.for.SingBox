import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  Download,
  HttpGet,
  MoveFile,
  UnzipZIPFile,
  MakeDir,
  RemoveFile,
  HttpCancel,
  OpenDir,
} from '@/bridge'
import { RollingReleaseDirectory } from '@/constant/app'
import {
  APP_TITLE,
  APP_VERSION,
  APP_VERSION_API,
  getGitHubApiAuthorization,
  ignoredError,
  message,
  alert,
  sampleID,
} from '@/utils'

import { useEnvStore } from './env'

import type { CustomAction, CustomActionFn, Menu } from '@/types/app'

export const useAppStore = defineStore('app', () => {
  const isAppExiting = ref(false)

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

  /* Modal Stack */
  const modalStack: (() => void)[] = []
  const modalZIndexCounter = 999

  /* Actions */
  const customActions = ref({
    core_state: [] as (CustomAction | CustomActionFn)[],
    title_bar: [] as (CustomAction | CustomActionFn)[],
    profiles_header: [] as (CustomAction | CustomActionFn)[],
    subscriptions_header: [] as (CustomAction | CustomActionFn)[],
  })
  const addCustomActions = (
    target: keyof typeof customActions.value,
    actions: CustomAction | CustomAction[] | CustomActionFn | CustomActionFn[],
  ) => {
    if (!customActions.value[target]) throw new Error('Target does not exist: ' + target)
    const _actions = Array.isArray(actions) ? actions : [actions]
    _actions.forEach((action) => (action.id = sampleID()))
    customActions.value[target].push(..._actions)
    const remove = () => {
      customActions.value[target] = customActions.value[target].filter(
        (a) => !_actions.some((added) => added.id === a.id),
      )
    }
    return remove
  }
  const removeCustomActions = (target: keyof typeof customActions.value, id: string | string[]) => {
    if (!customActions.value[target]) throw new Error('Target does not exist: ' + target)
    const ids = Array.isArray(id) ? id : [id]
    customActions.value[target] = customActions.value[target].filter((a) => !ids.includes(a.id!))
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
        setTimeout(() => RemoveFile(downloadCacheFile), 1000)
      })

      await MakeDir('data/.cache')
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
        await MoveFile(appName, appName + '.bak')
        await UnzipZIPFile(downloadCacheFile, '.')
        const suffix = { windows: '.exe', linux: '' }[os]
        await MoveFile(APP_TITLE + suffix, appName)
        message.success('about.updateSuccessfulRestart')
        restartable.value = true
      } else {
        await UnzipZIPFile(downloadCacheFile, 'data')
        alert('common.success', 'about.updateSuccessfulReplace')
        await OpenDir('data')
      }

      await RemoveFile(downloadCacheFile)
      await ignoredError(RemoveFile, RollingReleaseDirectory)
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
    isAppExiting,
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    modalStack,
    modalZIndexCounter,
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
    removeCustomActions,
  }
})
