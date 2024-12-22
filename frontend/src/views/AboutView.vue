<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'

import { useMessage, useAlert } from '@/hooks'
import { useEnvStore } from '@/stores'
import {
  Download,
  HttpGet,
  BrowserOpenURL,
  Movefile,
  RestartApp,
  UnzipZIPFile,
  Makedir,
  Removefile,
  AbsolutePath,
  HttpCancel,
} from '@/bridge'
import {
  APP_TITLE,
  APP_VERSION,
  PROJECT_URL,
  TG_GROUP,
  TG_CHANNEL,
  APP_VERSION_API,
  getGitHubApiAuthorization,
  ignoredError,
} from '@/utils'

let downloadUrl = ''

const loading = ref(false)
const downloading = ref(false)
const needRestart = ref(false)
const remoteVersion = ref(APP_VERSION)
const needUpdate = computed(() => APP_VERSION !== remoteVersion.value)

const { t } = useI18n()
const { alert } = useAlert()
const { message } = useMessage()
const envStore = useEnvStore()

const downloadApp = async () => {
  if (loading.value || downloading.value) return

  if (!downloadUrl) {
    message.error('about.noDownloadLink')
    return
  }

  downloading.value = true

  const { appName, os } = envStore.env

  const tmpFile = 'data/.cache/gui.zip'

  try {
    const { id } = message.info(t('common.downloading'), 10 * 60 * 1_000, () => {
      HttpCancel('download-app')
      setTimeout(() => Removefile(tmpFile), 1000)
    })

    await Makedir('data/.cache')

    await Download(
      downloadUrl,
      tmpFile,
      {},
      (progress, total) => {
        message.update(id, t('common.downloading') + ((progress / total) * 100).toFixed(2) + '%')
      },
      {
        CancelId: 'download-app',
      },
    ).finally(() => {
      message.destroy(id)
    })

    if (os !== 'darwin') {
      await Movefile(appName, appName + '.bak')
      await UnzipZIPFile(tmpFile, '.')
      const suffix = { windows: '.exe', linux: '' }[os]
      await Movefile(APP_TITLE + suffix, appName)
      message.success('about.updateSuccessfulRestart')
      needRestart.value = true
    } else {
      await UnzipZIPFile(tmpFile, 'data')
      alert('common.success', 'about.updateSuccessfulReplace')
      BrowserOpenURL(await AbsolutePath('data'))
    }

    await Removefile(tmpFile)

    await ignoredError(Removefile, 'data/rolling-release')
  } catch (error: any) {
    console.log(error)
    message.error(error, 5_000)
  }

  downloading.value = false
}

const checkForUpdates = async (showTips = false) => {
  if (loading.value || downloading.value) return

  loading.value = true

  try {
    const { body } = await HttpGet<Record<string, any>>(APP_VERSION_API, {
      Authorization: getGitHubApiAuthorization(),
    })

    const { tag_name, assets, message: msg } = body
    if (msg) throw msg

    const { os, arch } = envStore.env
    const assetName = `${APP_TITLE}-${os}-${arch}.zip`

    const asset = assets.find((v: any) => v.name === assetName)
    if (!asset) throw 'Asset Not Found:' + assetName

    remoteVersion.value = tag_name
    downloadUrl = asset.browser_download_url

    if (showTips) {
      message.info(needUpdate.value ? 'about.newVersion' : 'about.latestVersion')
    }
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }

  loading.value = false
}

const handleRestartApp = async () => {
  try {
    await RestartApp()
  } catch (error: any) {
    message.error(error)
  }
}

checkForUpdates()
</script>

<template>
  <div class="about">
    <img src="@/assets/logo.png" style="width: 128px" draggable="false" />
    <div class="appname">{{ APP_TITLE }}</div>
    <div class="appver">
      <Button v-if="needRestart" @click="handleRestartApp" size="small" type="primary">
        <Icon icon="restartApp" fill="var(--btn-primary-color)" style="margin-top: 1px" />
        <span style="margin-left: 4px">{{ t('about.restart') }}</span>
      </Button>
      <template v-else>
        <Button @click="checkForUpdates(true)" :loading="loading" type="link" size="small">
          {{ APP_VERSION }}
        </Button>
        <Button v-if="needUpdate" @click="downloadApp" :loading="downloading" size="small">
          {{ t('about.new') }}: {{ remoteVersion }}
        </Button>
      </template>
    </div>
    <div @click="BrowserOpenURL(PROJECT_URL)" class="url"><Icon icon="github" />GitHub</div>
    <div @click="BrowserOpenURL(TG_GROUP)" class="url"><Icon icon="telegram" />Telegram Group</div>
    <div @click="BrowserOpenURL(TG_CHANNEL)" class="url">
      <Icon icon="telegram" />Telegram Channel
    </div>
  </div>
</template>

<style lang="less" scoped>
.about {
  padding: 36px 0 0 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .appname {
    font-weight: bold;
    font-size: 16px;
    padding: 8px 0;
  }
  .appver {
    font-size: 12px;
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    min-height: 40px;
  }
  .url {
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 12px;
    text-decoration: underline;
  }
}
</style>
