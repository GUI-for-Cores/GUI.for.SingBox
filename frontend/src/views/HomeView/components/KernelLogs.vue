<script setup lang="ts">
import { h, withDirectives } from 'vue'

import { ClipboardSetText } from '@/bridge'
import vTips from '@/directives/tips'
import { useLogsStore } from '@/stores'
import { message } from '@/utils'

import Button from '@/components/Button/index.vue'

const logsStore = useLogsStore()

const modalSlots = {
  toolbar: () =>
    withDirectives(
      h(Button, {
        type: 'text',
        icon: 'file',
        onClick: async () => {
          if (logsStore.isEmpty) return
          await ClipboardSetText(logsStore.kernelLogs.join('\n'))
          message.success('common.success')
        },
      }),
      [[vTips, 'common.copy']],
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div class="h-full overflow-y-auto">
    <Empty v-if="logsStore.isEmpty" description="home.overview.noLogs" />
    <template v-else>
      <div
        v-for="(log, i) in logsStore.kernelLogs"
        :key="i"
        :style="{
          background: 'var(--card-bg)',
        }"
        class="text-12 my-4 py-2 px-4"
      >
        {{ log }}
      </div>
    </template>
  </div>
</template>
