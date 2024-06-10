<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  options?: { label: string; value: string }[]
  size?: 'default' | 'small'
}

const model = defineModel<string[]>({ default: [] })

withDefaults(defineProps<Props>(), {
  options: () => [],
  size: 'default'
})

const { t } = useI18n()

const isActive = (val: string) => model.value.includes(val)

const handleSelect = (val: string) => {
  const idx = model.value.findIndex((v) => v === val)
  if (idx !== -1) {
    model.value.splice(idx, 1)
  } else {
    model.value.push(val)
  }
}
</script>

<template>
  <div :class="[size]" class="checkbox">
    <div
      v-for="o in options"
      :key="o.value"
      @click="handleSelect(o.value)"
      :class="{ active: isActive(o.value) }"
      class="checkbox-button"
    >
      {{ t(o.label) }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.checkbox {
  display: inline-flex;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  overflow: hidden;
  font-size: 12px;
  &-button {
    cursor: pointer;
    color: var(--radio-normal-color);
    background-color: var(--radio-normal-bg);
    padding: 6px 12px;
    border-left: 1px solid var(--primary-color);
    transition: all 0.2s;
    white-space: nowrap;
    &:nth-child(1) {
      border-left: none;
    }
    &:hover {
      color: var(--radio-normal-hover-color);
    }
  }
  .active {
    color: var(--radio-primary-color);
    background-color: var(--radio-primary-bg);
    &:hover {
      background-color: var(--radio-primary-hover-bg);
    }
    &:active {
      background-color: var(--radio-primary-active-bg);
    }
  }
}

.small {
  .checkbox-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
