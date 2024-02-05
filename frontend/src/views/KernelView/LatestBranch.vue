<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'

import { useMessage } from '@/hooks'
import { ignoredError } from '@/utils'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import { KernelWorkDirectory, getKernelFileName } from '@/constant'
import {
  Download,
  UnzipZIPFile,
  HttpGetJSON,
  Exec,
  Movefile,
  Removefile,
  GetEnv,
  Makedir,
  UnzipGZFile
} from '@/utils/bridge'

const latestUrl = 'https://api.github.com/repos/SagerNet/sing-box/releases'
const localVersion = ref('')
const remoteVersion = ref('')
const versionDetail = ref('')
const localVersionLoading = ref(false)
const remoteVersionLoading = ref(false)
const downloadLoading = ref(false)
const downloadSuccessful = ref(false)

const needRestart = computed(() => {
  const { running, branch } = appSettings.app.kernel
  if (!running) return false
  return localVersion.value && downloadSuccessful.value && branch === 'latest'
})

const needUpdate = computed(() => remoteVersion.value && localVersion.value !== remoteVersion.value)

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const updateLocalVersion = async () => {
  localVersion.value = await getLocalVersion()
}

const updateRemoteVersion = async (showTips = false) => {
  remoteVersion.value = await getRemoteVersion(showTips)
}

const downloadCore = async () => {
  downloadLoading.value = true
  try {
    const { json } = await HttpGetJSON(latestUrl, {
      'User-Agent': appSettings.app.userAgent
    })
    const { os, arch } = await GetEnv()

    const { assets, name, message: msg } = json[0]
    if (msg) throw msg

    const suffix = { windows: '.zip', linux: '.gz', darwin: '.gz' }[os]
    const assetName = `sing-box-${name}-${os}-${arch}${suffix}`

    const asset = assets.find((v: any) => v.name === assetName)
    if (!asset) throw 'Asset Not Found:' + assetName

    const tmp = `data/core-latest${suffix}` // data/core-latest.zip or data/core-latest.gz

    await Makedir('data/sing-box')

    const { id } = message.info('Downloading...')

    await Download(asset.browser_download_url, tmp, (progress, total) => {
      message.update(id, 'Downloading...' + ((progress / total) * 100).toFixed(2) + '%')
    })

    const fileName = await getKernelFileName() // sing-box.exe
    const latestFileName = await getKernelFileName(true) // sing-box-latest.exe

    const latestKernelFilePath = KernelWorkDirectory + '/' + latestFileName
    const bakFile = latestKernelFilePath + '.bak'

    await ignoredError(Movefile, latestKernelFilePath, bakFile)

    if (suffix === '.zip') {
      await UnzipZIPFile(tmp, KernelWorkDirectory)
    } else {
      await UnzipGZFile(tmp, latestKernelFilePath)
    }

    const tmp_path = KernelWorkDirectory + `/sing-box-${name}-${os}-${arch}`
    await Movefile(tmp_path + '/' + fileName, latestKernelFilePath)
    await Removefile(tmp_path)
    await Removefile(tmp)
    await ignoredError(Removefile, bakFile)

    downloadSuccessful.value = true

    message.success('Download Successful')
  } catch (error: any) {
    console.log(error)
    message.error(error)
    downloadSuccessful.value = false
  }

  downloadLoading.value = false

  updateLocalVersion()
}

const getLocalVersion = async () => {
  localVersionLoading.value = true
  try {
    const fileName = await getKernelFileName(true)
    const kernelFilePath = KernelWorkDirectory + '/' + fileName
    const res = await Exec(kernelFilePath, ['version'])
    versionDetail.value = res.trim()
    return (
      res
        .trim()
        .match(/version \S+/)?.[0]
        .trim()
        .substring(8) || ''
    )
  } catch (error) {
    console.log(error)
  } finally {
    localVersionLoading.value = false
  }
  return ''
}

const getRemoteVersion = async (showTips = false) => {
  remoteVersionLoading.value = true
  try {
    const { json } = await HttpGetJSON(latestUrl, {
      'User-Agent': appSettings.app.userAgent
    })
    const { name } = json[0]
    return name as string
  } catch (error: any) {
    console.log(error)
    showTips && message.error(error)
  } finally {
    remoteVersionLoading.value = false
  }
  return ''
}

const handleRestartKernel = async () => {
  if (!appSettings.app.kernel.running) return

  try {
    await kernelApiStore.restartKernel()

    downloadSuccessful.value = false

    message.success('common.success')
  } catch (error: any) {
    message.error(error)
  }
}

const initVersion = async () => {
  getLocalVersion()
    .then((v) => {
      localVersion.value = v
    })
    .catch((error: any) => {
      console.log(error)
    })

  getRemoteVersion()
    .then((versions) => {
      remoteVersion.value = versions
    })
    .catch((error: any) => {
      console.log(error)
    })
}

initVersion()
</script>

<template>
  <h3>{{ t('settings.kernel.latest') }}</h3>
  <Tag @click="updateLocalVersion" style="cursor: pointer">
    {{ t('kernel.local') }}
    :
    {{ localVersionLoading ? 'Loading' : localVersion || t('kernel.notFound') }}
  </Tag>
  <Tag @click="updateRemoteVersion(true)" style="cursor: pointer">
    {{ t('kernel.remote') }}
    :
    {{ remoteVersionLoading ? 'Loading' : remoteVersion }}
  </Tag>
  <Button
    v-show="!localVersionLoading && !remoteVersionLoading && needUpdate"
    @click="downloadCore"
    :loading="downloadLoading"
    size="small"
    type="primary"
  >
    {{ t('kernel.update') }} : {{ remoteVersion }}
  </Button>
  <Button
    v-show="!localVersionLoading && !remoteVersionLoading && needRestart"
    @click="handleRestartKernel"
    :loading="kernelApiStore.loading"
    size="small"
    type="primary"
  >
    {{ t('kernel.restart') }}
  </Button>
  <div class="detail">
    {{ versionDetail }}
  </div>
</template>

<style lang="less" scoped>
.detail {
  font-size: 12px;
  padding: 8px 4px;
  word-wrap: break-word;
  word-break: break-all;
}
</style>
