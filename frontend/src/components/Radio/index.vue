<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: string | number | boolean
  options: { label: string; value: string | number | boolean }[]
  size?: 'default' | 'small'
}

withDefaults(defineProps<Props>(), {
  options: () => [],
  size: 'default'
})

const emits = defineEmits(['update:modelValue'])

const { t } = useI18n()

const handleChange = (val: string | number | boolean) => emits('update:modelValue', val)
</script>

<template>
  <div :class="[size]" class="radio">
    <div
      v-for="o in options"
      :key="o.value.toString()"
      @click="handleChange(o.value)"
      :class="{ active: o.value === modelValue }"
      class="radio-button"
    >
      {{ t(o.label) }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.radio {
  display: inline-flex;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  overflow: hidden;
  font-size: 12px;
  &-button {
    cursor: pointer;
    color: var(--radio-normal-color);
    background-color: var(--radio-normal-bg);
    padding: 7px 12px;
    border-left: 1px solid var(--primary-color);
    transition: all 0.2s;
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
  .radio-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
