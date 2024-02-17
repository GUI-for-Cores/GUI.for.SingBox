<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: string
  options: { label: string; value: string }[]
  border?: boolean
  size?: 'default' | 'small'
}

withDefaults(defineProps<Props>(), {
  options: () => [],
  border: true,
  size: 'default'
})

const emits = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()

const handleChange = (e: any) => {
  emits('update:modelValue', e.target.value)
  emits('change', e.target.value)
}
</script>

<template>
  <div :class="{ border, [size]: true }" class="select">
    <select :value="modelValue" @change="($event) => handleChange($event)">
      <option v-for="o in options" :key="o.value" :value="o.value">
        {{ t(o.label) }}
      </option>
    </select>
  </div>
</template>

<style lang="less" scoped>
.select {
  min-width: 120px;
  display: inline-block;
  border-radius: 8px;
  font-size: 12px;
  background: var(--select-bg);
  select {
    cursor: pointer;
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    outline: none;
    border: none;
    background: transparent;
    color: var(--select-color);
    option {
      background: var(--select-option-bg);
    }
  }
}

.border {
  border: 1px solid var(--primary-color);
}

.small {
  font-size: 12px;
  select {
    padding: 3px;
  }
}
</style>
