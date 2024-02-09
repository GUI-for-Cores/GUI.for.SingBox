<script setup lang="ts">
import { computed } from 'vue'

import i18n from '@/lang'

export type IconType = 'info' | 'warn' | 'error' | 'success'

interface Props {
  icon?: IconType
  content: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'info'
})

const { t } = i18n.global

const iconMap = {
  info: 'messageInfo',
  success: 'messageSuccess',
  error: 'messageError',
  warn: 'messageWarn'
}

const icon = computed(() => iconMap[props.icon] as any)
</script>

<template>
  <div class="message">
    <Icon style="flex-shrink: 0" :icon="icon" />
    <div class="content">{{ t(content) }}</div>
  </div>
</template>

<style lang="less" scoped>
.message {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  margin: 4px 0;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.2);
  background: var(--toast-bg);
  .content {
    font-size: 14px;
    padding: 0 8px;
    word-wrap: break-word;
    word-break: break-all;
  }
}
</style>
