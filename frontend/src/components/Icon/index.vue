<script setup lang="ts">
import { computed } from 'vue'

import { icons, type IconName } from './icons'

interface Props {
  icon: IconName
  size?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), { size: 16, color: 'var(--color)' })

const sizeWithUnit = computed(() => props.size + 'px')
</script>

<template>
  <div class="inline-flex">
    <span class="icon flex items-center justify-center" v-html="icons[icon] || icons.error" />
  </div>
</template>

<style>
.icon svg {
  width: v-bind(sizeWithUnit);
  height: v-bind(sizeWithUnit);
  fill: v-bind(color);
}
</style>
