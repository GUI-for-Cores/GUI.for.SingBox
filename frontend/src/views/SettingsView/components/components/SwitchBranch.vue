<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Branch } from '@/enums/app'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import { message } from '@/utils'

const { t } = useI18n()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const handleUseBranch = async (branch: Branch) => {
  appSettings.app.kernel.branch = branch

  if (!kernelApiStore.running) return

  try {
    await kernelApiStore.restartCore()
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
  }
}
</script>

<template>
  <div class="font-bold text-16 mx-4 my-12">{{ t('settings.kernel.version') }}</div>
  <div class="flex gap-8">
    <Card
      :selected="appSettings.app.kernel.branch === Branch.Main"
      @click="handleUseBranch(Branch.Main)"
      title="Stable"
      class="w-[36%]"
    >
      <div class="py-4 text-12">
        {{ t('settings.kernel.stable') }}
      </div>
    </Card>
    <Card
      :selected="appSettings.app.kernel.branch === Branch.Alpha"
      @click="handleUseBranch(Branch.Alpha)"
      title="Alpha"
      class="w-[36%]"
    >
      <div class="py-4 text-12">
        {{ t('settings.kernel.alpha') }}
      </div>
    </Card>
  </div>
</template>
