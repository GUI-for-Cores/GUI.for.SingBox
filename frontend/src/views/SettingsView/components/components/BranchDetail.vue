<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Removefile } from '@/bridge'
import { CoreCacheFilePath } from '@/constant/kernel'
import { useCoreBranch } from '@/hooks/useCoreBranch'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import { message } from '@/utils'

interface Props {
  isAlpha: boolean
}

const props = withDefaults(defineProps<Props>(), { isAlpha: false })

const emit = defineEmits(['config'])

const { t } = useI18n()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const {
  restartable,
  updatable,
  grantable,
  rollbackable,
  versionDetail,
  localVersion,
  localVersionLoading,
  remoteVersion,
  remoteVersionLoading,
  downloading,
  refreshLocalVersion,
  refreshRemoteVersion,
  downloadCore,
  restartCore,
  rollbackCore,
  grantCorePermission,
  openReleasePage,
} = useCoreBranch(props.isAlpha)

const handleClearCoreCache = async () => {
  try {
    if (appSettings.app.kernel.running) {
      await kernelApiStore.restartKernel(() => Removefile(CoreCacheFilePath))
    } else {
      await Removefile(CoreCacheFilePath)
    }
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
}
</script>

<template>
  <div class="font-bold text-16 mx-4 my-12">
    {{ isAlpha ? 'Alpha' : t('settings.kernel.name') }}
    <Button
      @click="grantCorePermission"
      v-if="grantable"
      v-tips="'settings.kernel.grant'"
      type="text"
      size="small"
      icon="grant"
    />
    <Button @click="openReleasePage" icon="link" type="text" size="small" />
    <Button
      @click="rollbackCore"
      v-if="rollbackable"
      v-tips="'settings.kernel.rollbackTip'"
      icon="rollback"
      type="text"
      size="small"
    />
    <Button
      @click="handleClearCoreCache"
      v-tips="'settings.kernel.clearCache'"
      type="text"
      size="small"
      icon="clear3"
    />
    <Button @click="emit('config')" type="text" size="small" icon="settings3" />
  </div>
  <div class="flex items-center py-8">
    <Tag @click="refreshLocalVersion(true)" class="cursor-pointer">
      {{ t('settings.kernel.local') }}
      :
      {{ localVersionLoading ? 'Loading' : localVersion || t('kernel.notFound') }}
    </Tag>
    <Tag @click="refreshRemoteVersion(true)" class="cursor-pointer">
      {{ t('settings.kernel.remote') }}
      :
      {{ remoteVersionLoading ? 'Loading' : remoteVersion }}
    </Tag>
    <Button
      v-show="!localVersionLoading && !remoteVersionLoading && updatable"
      @click="downloadCore"
      :loading="downloading"
      size="small"
      type="primary"
    >
      {{ t('settings.kernel.update') }} : {{ remoteVersion }}
    </Button>
    <Button
      v-show="!localVersionLoading && !remoteVersionLoading && restartable"
      @click="restartCore"
      :loading="kernelApiStore.loading"
      size="small"
      type="primary"
    >
      {{ t('settings.kernel.restart') }}
    </Button>
  </div>
  <div class="text-12 px-4 py-8 break-all">
    {{ versionDetail }}
  </div>
</template>
