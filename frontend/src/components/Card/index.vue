<script setup lang="ts">
import vTips from '@/directives/tips'

interface Props {
  title?: string
  subtitle?: string
  selected?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {})
</script>

<template>
  <div class="card">
    <div
      v-if="$slots['extra'] || $slots['title-prefix'] || $slots['title-suffix'] || title"
      class="header"
    >
      <slot name="title-prefix" />
      <div v-if="title" v-tips="title" class="title">{{ title }}</div>
      <slot name="title-suffix" />
      <div class="extra">
        <slot name="extra" />
      </div>
    </div>
    <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    <slot />
    <Icon v-if="selected" :size="32" icon="selected" fill="var(--primary-color)" class="status" />
    <Icon v-if="disabled" :size="32" icon="disabled" fill="var(--primary-color)" class="status" />
  </div>
</template>

<style lang="less" scoped>
.card {
  position: relative;
  color: var(--card-color);
  background-color: var(--card-bg);
  padding: 0 8px 8px 8px;
  border-radius: 8px;
  transition:
    box-shadow 0.4s,
    background-color 0.4s;
  &:hover {
    background-color: var(--card-hover-bg);
    box-shadow: 0 8px 8px rgba(0, 0, 0, 0.06);
  }
  &:active {
    background-color: var(--card-active-bg);
  }
  .header {
    display: flex;
    align-items: center;
    padding: 8px 0;
    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--card-color);
      font-size: 16px;
      font-weight: bold;
    }
    .extra {
      display: flex;
      align-items: center;
      margin-left: auto;
    }
  }
  .status {
    position: absolute;
    right: 8px;
    bottom: 4px;
  }
}
</style>
