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
  <div class="title">{{ t('settings.kernel.branch') }}</div>
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
</template>

<style lang="less" scoped>
.title {
  font-weight: bold;
  font-size: 16px;
  margin: 8px 4px;
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
