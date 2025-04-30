<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useKernelApiStore } from '@/stores'
import { useCoreBranch } from '@/hooks/useCoreBranch'

interface Props {
  isAlpha: boolean
}

const props = withDefaults(defineProps<Props>(), { isAlpha: false })

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
} = useCoreBranch(props.isAlpha)
</script>

<template>
  <div class="title">
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
  </div>
  <div class="tags">
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
