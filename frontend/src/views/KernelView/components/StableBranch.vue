<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'

import { useMessage } from '@/hooks'
import { CoreWorkingDirectory } from '@/constant/kernel'
import { getKernelFileName } from '@/utils'
import { useAppSettingsStore, useEnvStore, useKernelApiStore } from '@/stores'
import { getGitHubApiAuthorization, GrantTUNPermission, ignoredError } from '@/utils'
import {
  Download,
  HttpCancel,
  UnzipZIPFile,
  HttpGet,
  Exec,
  Movefile,
  Removefile,
  GetEnv,
  Makedir,
  AbsolutePath,
  BrowserOpenURL
} from '@/bridge'

const releaseUrl = 'https://api.github.com/repos/SagerNet/sing-box/releases/latest'
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
  return localVersion.value && downloadSuccessful.value && branch === 'main'
})

const needUpdate = computed(() => remoteVersion.value && localVersion.value !== remoteVersion.value)

const { t } = useI18n()
const { message } = useMessage()
const envStore = useEnvStore()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const updateLocalVersion = async (showTips = false) => {
  localVersion.value = await getLocalVersion(showTips)
}

const updateRemoteVersion = async (showTips = false) => {
  remoteVersion.value = await getRemoteVersion(showTips)
}

const downloadCore = async () => {
  downloadLoading.value = true
  try {
    const { body } = await HttpGet<Record<string, any>>(releaseUrl, {
      Authorization: getGitHubApiAuthorization()
    })
    const { os, arch } = await GetEnv()

    const { assets, name, message: msg } = body
    if (msg) throw msg

    const legacy = arch === 'amd64' && envStore.env.x64Level < 3 ? '-legacy' : ''

    const suffix = { windows: '.zip', linux: '.tar.gz', darwin: '.tar.gz' }[os]
    const assetName = `sing-box-${name}-${os}-${arch}${legacy}${suffix}`

    const asset = assets.find((v: any) => v.name === assetName)
    if (!asset) throw 'Asset Not Found:' + assetName

    const tmp = `data/core${suffix}` // data/core.zip or data/core.gz

    await Makedir('data/sing-box')

    const { id } = message.info(t('common.downloading'), 10 * 60 * 1_000, () => {
      HttpCancel('download-stable-core')
      setTimeout(() => Removefile(tmp), 1000)
    })

    await Download(
      asset.browser_download_url,
      tmp,
      undefined,
      (progress, total) => {
        message.update(id, t('common.downloading') + ((progress / total) * 100).toFixed(2) + '%')
      },
      { CancelId: 'download-stable-core' }
    ).catch((err) => {
      message.destroy(id)
      throw err
    })

    message.destroy(id)

    const fileName = await getKernelFileName()

    const kernelFilePath = CoreWorkingDirectory + '/' + fileName

    await ignoredError(Movefile, kernelFilePath, kernelFilePath + '.bak')

    if (suffix === '.zip') {
      await UnzipZIPFile(tmp, CoreWorkingDirectory)
      const tmpPath = CoreWorkingDirectory + `/sing-box-${name}-${os}-${arch}${legacy}`
      await Movefile(tmpPath + '/' + fileName, kernelFilePath)
      await Removefile(tmpPath)
    } else {
      await Exec('tar', [
        'xzvf',
        await AbsolutePath(tmp),
        '-C',
        await AbsolutePath(CoreWorkingDirectory),
        '--strip-components',
        '1'
      ])
    }

    await Removefile(tmp)

    if (['darwin', 'linux'].includes(os)) {
      await ignoredError(Exec, 'chmod', ['+x', await AbsolutePath(kernelFilePath)])
    }

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

const getLocalVersion = async (showTips = false) => {
  localVersionLoading.value = true
  try {
    const fileName = await getKernelFileName()
    const kernelFilePath = CoreWorkingDirectory + '/' + fileName
    const res = await Exec(kernelFilePath, ['version'])
    versionDetail.value = res.trim()
    return (
      res
        .trim()
        .match(/version \S+/)?.[0]
        .trim()
        .substring(8) || ''
    )
  } catch (error: any) {
    console.log(error)
    showTips && message.error(error)
  } finally {
    localVersionLoading.value = false
  }
  return ''
}

const getRemoteVersion = async (showTips = false) => {
  remoteVersionLoading.value = true
  try {
    const { body } = await HttpGet<Record<string, any>>(releaseUrl, {
      Authorization: getGitHubApiAuthorization()
    })
    const { name } = body
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

const handleGrantPermission = async () => {
  const fileName = await getKernelFileName()
  const kernelFilePath = CoreWorkingDirectory + '/' + fileName
  await GrantTUNPermission(kernelFilePath)
  message.success('common.success')
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
  <div class="title">
    {{ t('settings.kernel.name') }}
    <Button
      @click="handleGrantPermission"
      v-if="localVersion && envStore.env.os !== 'windows'"
      v-tips="'settings.kernel.grant'"
      type="text"
      size="small"
      icon="grant"
    />
    <Button
      @click="BrowserOpenURL('https://github.com/SagerNet/sing-box/releases/latest')"
      icon="link"
      type="text"
      size="small"
    />
  </div>
  <div class="tags">
    <Tag @click="updateLocalVersion(true)" style="cursor: pointer">
      {{ t('settings.kernel.local') }}
      :
      {{ localVersionLoading ? 'Loading' : localVersion || t('kernel.notFound') }}
    </Tag>
    <Tag @click="updateRemoteVersion(true)" style="cursor: pointer">
      {{ t('settings.kernel.remote') }}
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
      {{ t('settings.kernel.update') }} : {{ remoteVersion }}
    </Button>
    <Button
      v-show="!localVersionLoading && !remoteVersionLoading && needRestart"
      @click="handleRestartKernel"
      :loading="kernelApiStore.loading"
      size="small"
      type="primary"
    >
      {{ t('settings.kernel.restart') }}
    </Button>
  </div>
  <div class="detail">
    {{ versionDetail }}
  </div>
</template>

<style lang="less" scoped>
.title {
  font-weight: bold;
  font-size: 16px;
  margin: 12px 4px;
}
.detail {
  font-size: 12px;
  padding: 8px 4px;
  word-wrap: break-word;
  word-break: break-all;
}
.tags {
  display: flex;
  align-items: center;
  min-height: 34px;
}
</style>
