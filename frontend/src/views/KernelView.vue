<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
  Makedir
} from '@/utils/bridge'

const releaseUrl = 'https://api.github.com/repos/SagerNet/sing-box/releases/latest'
const latestUrl = 'https://api.github.com/repos/SagerNet/sing-box/releases'

const downloadLoading = ref([false, false])
const getLocalVersionLoading = ref([false, false])
const getRemoteVersionLoading = ref([false, false])
const localVersion = ref(['', ''])
const remoteVersion = ref(['', ''])
const versionDetail = ref(['', ''])
const restartLoading = ref([false, false])
const downloadSuccessful = ref([false, false])
const needRestarts = computed(() => {
  const { running, branch } = appSettings.app.kernel
  if (!running) return [false, false]

  return [
    localVersion.value[0] && downloadSuccessful.value[0] && branch === 'main',
    localVersion.value[1] && downloadSuccessful.value[1] && branch === 'latest'
  ]
})

const needUpdates = computed(() => [
  remoteVersion.value[0] && localVersion.value[0] !== remoteVersion.value[0],
  remoteVersion.value[1] && localVersion.value[1] !== remoteVersion.value[1]
])

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const downloadCore = async () => {
  downloadLoading.value[0] = true
  try {
    const { json } = await HttpGetJSON(releaseUrl, {
      'User-Agent': appSettings.app.userAgent
    })
    const { os, arch } = await GetEnv()

    const { assets, name, message: msg } = json
    if (msg) throw msg

    const suffix = { windows: '.zip', linux: '.gz' }[os]
    const assetName = `sing-box-${name}-${os}-${arch}${suffix}`

    const asset = assets.find((v: any) => v.name === assetName)
    if (!asset) throw 'Asset Not Found:' + assetName

    const tmp = `data/core${suffix}` // data/core.zip or data/core.gz

    await Makedir('data/sing-box')

    await Download(asset.browser_download_url, tmp)

    const fileName = await getKernelFileName()

    const kernelFilePath = KernelWorkDirectory + '/' + fileName

    await ignoredError(Movefile, kernelFilePath, kernelFilePath + '.bak')

    if (suffix === '.zip') {
      await UnzipZIPFile(tmp, KernelWorkDirectory)
    } else {
      // TODO: unzip gz
    }

    const tmp_path = KernelWorkDirectory + `/sing-box-${name}-${os}-${arch}`
    await Movefile(tmp_path + '/' + fileName, kernelFilePath)
    await Removefile(tmp_path)
    await Removefile(tmp)

    downloadSuccessful.value[0] = true

    message.info('Download Successful')
  } catch (error: any) {
    console.log(error)
    message.info(error)
    downloadSuccessful.value[0] = false
  }
  downloadLoading.value[0] = false

  updateLocalVersion()
}

const downloadLatestCore = async () => {
  downloadLoading.value[1] = true
  try {
    const { json } = await HttpGetJSON(latestUrl, {
      'User-Agent': appSettings.app.userAgent
    })
    const { os, arch } = await GetEnv()

    const { assets, name, message: msg } = json[0]
    if (msg) throw msg

    const suffix = { windows: '.zip', linux: '.gz' }[os]
    const assetName = `sing-box-${name}-${os}-${arch}${suffix}`

    const asset = assets.find((v: any) => v.name === assetName)
    if (!asset) throw 'Asset Not Found:' + assetName

    const tmp = `data/core-latest${suffix}` // data/core-latest.zip or data/core-latest.gz

    await Makedir('data/sing-box')

    await Download(asset.browser_download_url, tmp)

    const fileName = await getKernelFileName() // sing-box.exe
    const latestFileName = await getKernelFileName(true) // sing-box-latest.exe

    const latestKernelFilePath = KernelWorkDirectory + '/' + latestFileName

    await ignoredError(Movefile, latestKernelFilePath, latestKernelFilePath + '.bak')

    if (suffix === '.zip') {
      await UnzipZIPFile(tmp, KernelWorkDirectory)
    } else {
      // TODO: unzip gz
    }

    const tmp_path = KernelWorkDirectory + `/sing-box-${name}-${os}-${arch}`
    await Movefile(tmp_path + '/' + fileName, latestKernelFilePath)
    await Removefile(tmp_path)
    await Removefile(tmp)

    downloadSuccessful.value[1] = true

    message.info('Download Successful')
  } catch (error: any) {
    console.log(error)
    message.info(error)
    downloadSuccessful.value[1] = false
  }
  downloadLoading.value[1] = false

  updateLatestLocalVersion()
}

const getLocalVersion = async () => {
  getLocalVersionLoading.value[0] = true
  try {
    const fileName = await getKernelFileName()
    const kernelFilePath = KernelWorkDirectory + '/' + fileName
    const res = await Exec(kernelFilePath, ['version'])
    versionDetail.value[0] = res.trim()
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
    getLocalVersionLoading.value[0] = false
  }
  return ''
}

const getLatestLocalVersion = async () => {
  getLocalVersionLoading.value[1] = true
  try {
    const fileName = await getKernelFileName(true)
    const kernelFilePath = KernelWorkDirectory + '/' + fileName
    const res = await Exec(kernelFilePath, ['version'])
    versionDetail.value[1] = res.trim()
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
    getLocalVersionLoading.value[1] = false
  }
  return ''
}

const getRemoteVersion = async (showTips = false) => {
  getRemoteVersionLoading.value[0] = true
  try {
    const { json } = await HttpGetJSON(releaseUrl, {
      'User-Agent': appSettings.app.userAgent
    })
    const { name } = json
    return name as string
  } catch (error: any) {
    console.log(error)
    showTips && message.info(error)
  } finally {
    getRemoteVersionLoading.value[0] = false
  }
  return ''
}

const getLatestRemoteVersion = async (showTips = false) => {
  getRemoteVersionLoading.value[1] = true
  try {
    const { json } = await HttpGetJSON(latestUrl, {
      'User-Agent': appSettings.app.userAgent
    })
    const { name } = json[0]
    return name as string
  } catch (error: any) {
    console.log(error)
    showTips && message.info(error)
  } finally {
    getRemoteVersionLoading.value[1] = false
  }
  return ''
}

const updateLocalVersion = async () => {
  localVersion.value[0] = await getLocalVersion()
}

const updateLatestLocalVersion = async () => {
  localVersion.value[1] = await getLatestLocalVersion()
}

const updateRemoteVersion = async (showTips = false) => {
  remoteVersion.value[0] = await getRemoteVersion(showTips)
}

const updateLatestRemoteVersion = async (showTips = false) => {
  remoteVersion.value[1] = await getLatestRemoteVersion(showTips)
}

const initVersion = async () => {
  Promise.all([getLocalVersion(), getLatestLocalVersion()])
    .then((versions) => {
      localVersion.value = versions
    })
    .catch((error: any) => {
      console.log(error)
    })

  Promise.all([getRemoteVersion(), getLatestRemoteVersion()])
    .then((versions) => {
      remoteVersion.value = versions
    })
    .catch((error: any) => {
      console.log(error)
    })
}

const handleRestartKernel = async (index: 0 | 1) => {
  if (!appSettings.app.kernel.running) return

  try {
    await kernelApiStore.restartKernel()

    downloadSuccessful.value[index] = false

    message.info('common.success')
  } catch (error: any) {
    message.info(error)
  }
}

const handleUseBranch = async (branch: any) => {
  appSettings.app.kernel.branch = branch

  if (!appSettings.app.kernel.running) return

  try {
    await kernelApiStore.restartKernel()
    message.info('common.success')
  } catch (error: any) {
    message.info(error)
  }
}

initVersion()
</script>

<template>
  <div class="kernel">
    <div class="item">
      <h3>{{ t('settings.kernel.main') }}</h3>
      <Tag @click="updateLocalVersion" style="cursor: pointer">
        {{ t('kernel.local') }}
        :
        {{ getLocalVersionLoading[0] ? 'Loading' : localVersion[0] || t('kernel.notFound') }}
      </Tag>
      <Tag @click="updateRemoteVersion(true)" style="cursor: pointer">
        {{ t('kernel.remote') }}
        :
        {{ getRemoteVersionLoading[0] ? 'Loading' : remoteVersion[0] }}
      </Tag>
      <Button
        v-show="needUpdates[0]"
        @click="downloadCore"
        :loading="downloadLoading[0]"
        type="primary"
      >
        {{ t('kernel.update') }} : {{ remoteVersion[0] }}
      </Button>
      <Button
        v-show="needRestarts[0]"
        @click="handleRestartKernel(0)"
        :loading="restartLoading[0]"
        type="primary"
      >
        {{ t('kernel.restart') }}
      </Button>
      <div class="detail">
        {{ versionDetail[0] }}
      </div>
    </div>

    <div class="item">
      <h3>{{ t('settings.kernel.latest') }}</h3>
      <Tag @click="updateLatestLocalVersion" style="cursor: pointer">
        {{ t('kernel.local') }}
        :
        {{ getLocalVersionLoading[1] ? 'Loading' : localVersion[1] || t('kernel.notFound') }}
      </Tag>
      <Tag @click="updateLatestRemoteVersion(true)" style="cursor: pointer">
        {{ t('kernel.remote') }}
        :
        {{ getRemoteVersionLoading[1] ? 'Loading' : remoteVersion[1] }}
      </Tag>
      <Button
        v-show="needUpdates[1]"
        @click="downloadLatestCore"
        :loading="downloadLoading[1]"
        type="primary"
      >
        {{ t('kernel.update') }} : {{ remoteVersion[1] }}
      </Button>
      <Button
        v-show="needRestarts[1]"
        @click="handleRestartKernel(1)"
        :loading="restartLoading[1]"
        type="primary"
      >
        {{ t('kernel.restart') }}
      </Button>
      <div class="detail">
        {{ versionDetail[1] }}
      </div>
    </div>

    <div class="item">
      <h3>{{ t('settings.kernel.branch') }}</h3>
      <div class="branch">
        <Card
          :selected="appSettings.app.kernel.branch === 'main'"
          @click="handleUseBranch('main')"
          title="Main"
          class="branch-item"
        >
          {{ t('settings.kernel.main') }}
        </Card>
        <Card
          :selected="appSettings.app.kernel.branch === 'latest'"
          @click="handleUseBranch('latest')"
          title="Latest"
          class="branch-item"
        >
          {{ t('settings.kernel.latest') }}
        </Card>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.item {
  .detail {
    font-size: 12px;
    padding: 8px 4px;
  }
}

.branch {
  display: flex;
  &-item {
    width: 36%;
    margin-right: 8px;
    height: 70px;
    font-size: 12px;
  }
}
</style>
