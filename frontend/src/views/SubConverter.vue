<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'

import { useMessage } from '@/hooks'
import { ignoredError } from '@/utils'
import { useSubconverterStore } from '@/stores'
import { Download, HttpGet, BrowserOpenURL, Movefile, GetEnv, Removefile } from '@/bridge'

let downloadUrl = ''

const loading = ref(false)
const downloading = ref(false)
const { t } = useI18n()
const { message } = useMessage()

const subconverter = useSubconverterStore()

const remoteVersion = ref(subconverter.SUBCONVERTER_VERSION)
const needUpdate = computed(() => subconverter.SUBCONVERTER_VERSION !== remoteVersion.value)

const downloadApp = async () => {
  if (loading.value || downloading.value) return

  if (!needUpdate.value) {
    message.info('about.noNeedUpdate')
    return
  }

  if (!downloadUrl) {
    message.info('about.noDownloadLink')
    return
  }

  downloading.value = true

  try {
    const appPath = subconverter.SUBCONVERTER_PATH

    const { id } = message.info('Downloading...', 10 * 60 * 1_000)

    await Download(downloadUrl, appPath + '.tmp', {}, (progress, total) => {
      message.update(id, 'Downloading...' + ((progress / total) * 100).toFixed(2) + '%')
    }).catch((err) => {
      message.destroy(id)
      throw err
    })

    message.destroy(id)

    const bakFile = appPath + '_' + subconverter.SUBCONVERTER_VERSION + '.bak'

    await ignoredError(Movefile, appPath, bakFile)

    await Movefile(appPath + '.tmp', appPath)
    subconverter.SUBCONVERTER_VERSION = remoteVersion.value
    subconverter.SUBCONVERTER_EXISTS = true

    await ignoredError(Removefile, bakFile)

    message.success('about.updateSuccessful')
  } catch (error: any) {
    console.log(error)
    message.error(error, 5_000)
  }

  downloading.value = false
}

const checkForUpdates = async (showTips = false) => {
  if (loading.value || downloading.value) return

  loading.value = true

  await subconverter.ensureInitialized()

  try {
    const { body } = await HttpGet(subconverter.SUBCONVERTER_VERSION_API)
    const { os, arch } = await GetEnv()

    const { tag_name, assets, message: msg } = body
    if (msg) throw msg

    const suffix = { windows: '.exe', linux: '', darwin: '' }[os]
    const assetName = `sing-box-subconverter-${os}-${arch}${suffix}`

    const asset = assets.find((v: any) => v.name === assetName)
    if (!asset) throw 'Asset Not Found:' + assetName

    remoteVersion.value = tag_name
    downloadUrl = asset.browser_download_url

    if (showTips) {
      message.info(needUpdate.value ? 'about.newVersion' : 'about.latestVersion')
    }
  } catch (error: any) {
    console.error(error)
    message.info(error)
  }

  loading.value = false
}

checkForUpdates()
</script>

<template>
  <div class="about">
    <img src="@/assets/logo.png" style="width: 128px" draggable="false" />
    <div class="appname">sing-box-subconverer</div>
    <div class="appver">
      <Button @click="checkForUpdates(true)" :loading="loading" type="link" size="small">
        {{ subconverter.SUBCONVERTER_VERSION }}
      </Button>
      <Button v-if="needUpdate" @click="downloadApp" :loading="downloading" size="small">
        {{ t('about.new') }}: {{ remoteVersion }}
      </Button>
    </div>
    <div @click="BrowserOpenURL(subconverter.SUBCONVERTER_URL)" class="url">
      <Icon icon="github" />GitHub
    </div>
  </div>
</template>

<style lang="less" scoped>
.about {
  padding: 22px 0 0 0;
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
    margin-bottom: 12px;
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
