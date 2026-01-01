<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { RemoveFile } from '@/bridge'
import { CoreCacheFilePath } from '@/constant/kernel'
import { useCoreBranch } from '@/hooks/useCoreBranch'
import { useKernelApiStore } from '@/stores'
import { message } from '@/utils'

interface Props {
  isAlpha: boolean
}

const props = withDefaults(defineProps<Props>(), { isAlpha: false })

const emit = defineEmits(['config'])

const { t } = useI18n()
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
  openFileLocation,
} = useCoreBranch(props.isAlpha)

const handleClearCoreCache = async () => {
  try {
    if (kernelApiStore.running) {
      await kernelApiStore.restartCore(() => RemoveFile(CoreCacheFilePath))
    } else {
      await RemoveFile(CoreCacheFilePath)
    }
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
}
</script>

<template>
  <div class="flex items-center px-4 my-12">
    <div class="mr-8 font-bold text-16">
      {{ isAlpha ? 'Alpha' : t('settings.kernel.name') }}
    </div>
    <Button
      v-if="rollbackable"
      v-tips="'settings.kernel.rollbackTip'"
      icon="rollback"
      type="text"
      size="small"
      @click="rollbackCore"
    />
    <Button
      v-tips="'settings.kernel.clearCache'"
      type="text"
      size="small"
      icon="clear3"
      @click="handleClearCoreCache"
    />
    <Button
      v-if="grantable"
      v-tips="'settings.kernel.grant'"
      type="text"
      size="small"
      icon="grant"
      @click="grantCorePermission"
    />
    <Button
      v-tips="'settings.kernel.linkTip'"
      icon="link"
      type="text"
      size="small"
      @click="openReleasePage"
    />
    <Button
      v-tips="'settings.kernel.openTip'"
      icon="folder2"
      type="text"
      size="small"
      @click="openFileLocation"
    />
    <Button
      v-tips="'settings.kernel.config.name'"
      type="text"
      size="small"
      icon="settings3"
      @click="emit('config')"
    />
  </div>
  <div class="flex items-center py-8 min-h-42">
    <Tag class="cursor-pointer" @click="refreshLocalVersion(true)">
      {{ t('settings.kernel.local') }}
      :
      {{ localVersionLoading ? 'Loading' : localVersion || t('kernel.notFound') }}
    </Tag>
    <Tag class="cursor-pointer" @click="refreshRemoteVersion(true)">
      {{ t('settings.kernel.remote') }}
      :
      {{ remoteVersionLoading ? 'Loading' : remoteVersion }}
    </Tag>
    <Button
      v-show="!localVersionLoading && !remoteVersionLoading && updatable"
      :loading="downloading"
      size="small"
      type="primary"
      @click="downloadCore"
    >
      {{ t('settings.kernel.update') }} : {{ remoteVersion }}
    </Button>
    <Button
      v-show="!localVersionLoading && !remoteVersionLoading && restartable"
      :loading="kernelApiStore.restarting"
      size="small"
      type="primary"
      @click="restartCore"
    >
      {{ t('settings.kernel.restart') }}
    </Button>
  </div>
  <div class="text-12 px-4 py-8 break-all">
    {{ versionDetail }}
  </div>
</template>
