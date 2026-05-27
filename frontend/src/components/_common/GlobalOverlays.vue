<script setup lang="ts">
import * as Stores from '@/stores'
import { message } from '@/utils'
import { AboutView, CommandView } from '@/components'

interface Props {
  loading: boolean
}

defineProps<Props>()

const appStore = Stores.useAppStore()
const kernelApiStore = Stores.useKernelApiStore()

const handleRestartCore = async () => {
  try {
    await kernelApiStore.restartCore()
  } catch (error: unknown) {
    message.error(error instanceof Error ? error.message : String(error))
  }
}
</script>

<template>
  <Modal
    v-model:open="appStore.showAbout"
    :cancel="false"
    :submit="false"
    mask-closable
    min-width="50"
  >
    <AboutView />
  </Modal>

  <Menu
    v-model="appStore.menuShow"
    :position="appStore.menuPosition"
    :menu-list="appStore.menuList"
  />

  <Tips
    v-model="appStore.tipsShow"
    :position="appStore.tipsPosition"
    :message="appStore.tipsMessage"
  />

  <CommandView v-if="!loading" />

  <div
    v-if="kernelApiStore.needRestart || kernelApiStore.restarting"
    class="fixed right-32 bottom-32"
  >
    <Button
      v-tips="'home.overview.restart'"
      :loading="kernelApiStore.restarting"
      icon="restart"
      class="rounded-full w-42 h-42 shadow"
      @click="handleRestartCore"
    />
  </div>
</template>
