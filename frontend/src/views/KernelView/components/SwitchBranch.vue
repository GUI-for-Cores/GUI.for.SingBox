<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMessage } from '@/hooks'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const handleUseBranch = async (branch: any) => {
  appSettings.app.kernel.branch = branch

  if (!appSettings.app.kernel.running) return

  try {
    await kernelApiStore.restartKernel()
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
  }
}
</script>

<template>
  <div class="title">{{ t('settings.kernel.version') }}</div>
  <div class="branch">
    <Card
      :selected="appSettings.app.kernel.branch === 'main'"
      @click="handleUseBranch('main')"
      title="Stable"
      class="branch-item"
    >
      {{ t('settings.kernel.stable') }}
    </Card>
    <Card
      :selected="appSettings.app.kernel.branch === 'alpha'"
      @click="handleUseBranch('alpha')"
      title="Alpha"
      class="branch-item"
    >
      {{ t('settings.kernel.alpha') }}
    </Card>
  </div>
</template>

<style lang="less" scoped>
.title {
  font-weight: bold;
  font-size: 16px;
  margin: 12px 4px;
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
