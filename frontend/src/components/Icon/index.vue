<script setup lang="ts">
import { icons, type IconName } from './icons'

interface Props {
  icon: IconName
  size?: number
  color?: string
}

withDefaults(defineProps<Props>(), { size: 16, color: 'var(--color)' })
</script>

<template>
  <div class="inline-flex">
    <span
      class="icon flex items-center justify-center"
      :style="{
        width: size + 'px',
        height: size + 'px',
      }"
      v-html="icons[icon] || icons.error"
    />
  </div>
</template>

<style>
.icon svg {
  fill: v-bind(color);
}
</style>
