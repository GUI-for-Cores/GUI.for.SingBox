<script setup lang="ts">
import { computed } from 'vue'

import i18n from '@/lang'

export type MessageIcon = 'info' | 'warn' | 'error' | 'success'

interface Props {
  icon?: MessageIcon
  content: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'info',
})

defineEmits(['close'])

const { t } = i18n.global

const iconMap = {
  info: 'messageInfo',
  success: 'messageSuccess',
  error: 'messageError',
  warn: 'messageWarn',
}

const icon = computed(() => iconMap[props.icon] as any)
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="gui-message flex items-center p-8 pl-16 rounded-8 my-4 shadow">
      <Icon class="shrink-0" :icon="icon" />
      <div class="text-14 pl-12 break-all">{{ t(content) }}</div>
      <Button
        icon="close"
        :icon-size="10"
        type="text"
        size="small"
        class="close px-4 invisible"
        @click="$emit('close')"
      />
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-message {
  background: var(--toast-bg);
  &:hover {
    .close {
      visibility: visible;
    }
  }
}
</style>
