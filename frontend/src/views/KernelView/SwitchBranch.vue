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
    message.info('common.success')
  } catch (error: any) {
    message.info(error)
  }
}
</script>

<template>
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
</template>

<style lang="less" scoped>
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
