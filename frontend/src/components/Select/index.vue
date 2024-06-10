<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  options: { label: string; value: string }[]
  border?: boolean
  size?: 'default' | 'small'
  placeholder?: string
  autoSize?: boolean
}

const model = defineModel<string>({ default: '' })

withDefaults(defineProps<Props>(), {
  options: () => [],
  border: true,
  size: 'default',
  autoSize: false
})

const emits = defineEmits(['change'])

const { t } = useI18n()
</script>

<template>
  <div :class="{ border, [size]: true, 'auto-size': autoSize }" class="select">
    <select v-model="model" @change="emits('change', model)">
      <option v-if="placeholder" value="">{{ t(placeholder) }}</option>
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
  border-radius: 4px;
  font-size: 12px;
  background: var(--select-bg);
  select {
    cursor: pointer;
    width: 100%;
    padding: 6px 8px;
    outline: none;
    border: none;
    background: transparent;
    color: var(--select-color);
    option {
      background: var(--select-option-bg);
    }
  }
}

.auto-size {
  width: 100%;
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
