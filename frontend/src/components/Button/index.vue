<script setup lang="ts">
import type { IconType } from '@/components/Icon/index.vue'

interface Props {
  type?: 'primary' | 'normal' | 'link' | 'text'
  size?: 'default' | 'small' | 'large'
  iconSize?: number
  iconColor?: string
  icon?: IconType
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'normal',
  size: 'default',
  loading: false,
  disabled: false
})
</script>

<template>
  <div :class="[type, size, { disabled, loading }]" class="btn">
    <Icon v-if="loading" :fill="`var(--btn-${type}-color)`" icon="loading" class="rotation" />
    <template v-else>
      <Icon v-if="disabled" :fill="`var(--btn-${type}-color)`" icon="forbidden" class="disabled" />
      <Icon
        v-if="icon"
        :icon="icon"
        :size="iconSize"
        :fill="iconColor || `var(--btn-${type}-color)`"
        :class="$slots.default ? 'mr-4' : ''"
      />
    </template>
    <slot />
  </div>
</template>

<style lang="less" scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  vertical-align: middle;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  margin: 2px;
  transition: all 0.2s;
}

.disabled,
.loading {
  pointer-events: none;
}

.normal {
  color: var(--btn-normal-color);
  background-color: var(--btn-normal-bg);
  &:hover {
    color: var(--btn-normal-hover-color);
    border-color: var(--btn-normal-hover-border-color);
  }
  &:active {
    color: var(--btn-normal-active-color);
    border-color: var(--btn-normal-active-border-color);
  }
}

.primary {
  color: var(--btn-primary-color);
  background-color: var(--btn-primary-bg);
  border: none;
  &:hover {
    background-color: var(--btn-primary-hover-bg);
  }
  &:active {
    background-color: var(--btn-primary-active-bg);
  }
}

.link {
  color: var(--btn-link-color);
  background-color: var(--btn-link-bg);
  border: none;
  &:hover {
    color: var(--btn-link-hover-color);
  }
  &:active {
    color: var(--btn-link-active-color);
  }
}

.text {
  color: var(--btn-text-color);
  background-color: var(--btn-text-bg);
  border: none;
  &:hover {
    color: var(--btn-text-hover-color);
    background-color: var(--btn-text-hover-bg);
  }
  &:active {
    color: var(--btn-text-active-color);
    background-color: var(--btn-text-active-bg);
  }
}

.small {
  padding: 4px 8px;
  font-size: 12px;
}
.large {
  padding: 8px 12px;
  font-size: 16px;
}

.rotation {
  animation: rotate 2s infinite linear;
}
</style>
