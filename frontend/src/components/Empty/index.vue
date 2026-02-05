<script lang="ts" setup>
import type { IconName } from '@/components/Icon/icons'

interface Props {
  icon?: IconName
  iconSize?: number
  description?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'empty',
  iconSize: 64,
  description: 'common.empty',
})
</script>

<template>
  <div class="gui-empty flex flex-col w-full h-full items-center justify-center">
    <Icon :icon="icon" :size="iconSize" />
    <slot name="description">
      <div class="text-12 py-8">{{ $t(description) }}</div>
    </slot>
  </div>
</template>
