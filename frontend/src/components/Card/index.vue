<script setup lang="ts">
import { computed, useSlots } from 'vue'

import vTips from '@/directives/tips'

interface Props {
  title?: string
  subtitle?: string
  selected?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()

const slots = useSlots()

const hasTitle = computed(() => {
  return slots.extra || slots['title-prefix'] || slots['title-suffix'] || props.title
})
</script>

<template>
  <div class="gui-card rounded-8 relative flex flex-col">
    <div v-if="hasTitle" class="card-header flex items-center break-all p-8">
      <slot name="title-prefix"></slot>
      <div v-if="title" v-tips="title" class="card-header_title line-clamp-1 text-16 font-bold">
        {{ title }}
      </div>
      <slot name="title-suffix"></slot>
      <div class="card-header_extra flex items-center ml-auto">
        <slot name="extra"></slot>
      </div>
    </div>
    <div v-if="subtitle" class="card-header_subtitle mx-8">{{ subtitle }}</div>
    <div class="flex-1 px-8" :class="hasTitle ? 'pb-8' : ''">
      <slot></slot>
    </div>
    <Icon
      v-if="selected"
      :size="24"
      icon="selected"
      color="var(--primary-color)"
      class="absolute right-8 bottom-4"
    />
    <Icon
      v-if="disabled"
      :size="32"
      icon="disabled"
      color="var(--primary-color)"
      class="absolute right-8 bottom-4"
    />
  </div>
</template>

<style lang="less" scoped>
.gui-card {
  color: var(--card-color);
  background-color: var(--card-bg);
  transition:
    box-shadow 0.2s,
    background 0.2s;
  &:hover {
    box-shadow: 0 8px 8px rgba(0, 0, 0, 0.06);
    background-color: var(--card-hover-bg);
  }
  &:active {
    background-color: var(--card-active-bg);
  }
  &-header {
    &_title {
      color: var(--card-color);
    }
  }
}
</style>
