<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  options: { label: string; value: string | number | boolean }[]
  size?: 'default' | 'small'
}

const model = defineModel<string | number | boolean>()

withDefaults(defineProps<Props>(), {
  options: () => [],
  size: 'default',
})

const emits = defineEmits(['change'])

const { t } = useI18n()

const handleSelect = (val: string | number | boolean) => {
  const oldValue = model.value
  if (oldValue === val) {
    return
  }
  model.value = val
  emits('change', val, oldValue)
}
</script>

<template>
  <div :class="[size]" class="gui-radio inline-flex rounded-full text-12 overflow-hidden">
    <div
      v-for="o in options"
      :key="o.value.toString()"
      v-tips.slow="o.label"
      @click="handleSelect(o.value)"
      :class="{ active: o.value === model }"
      class="gui-radio-button cursor-pointer px-12 py-6 duration-200 line-clamp-1 break-all"
    >
      {{ t(o.label) }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-radio {
  border: 1px solid var(--primary-color);
  &-button {
    color: var(--radio-normal-color);
    background-color: var(--radio-normal-bg);
    border-left: 1px solid var(--primary-color);
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
  .gui-radio-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
