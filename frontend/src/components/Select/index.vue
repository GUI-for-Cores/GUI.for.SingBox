<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  options: { label: string; value: string }[]
  border?: boolean
  size?: 'default' | 'small'
  placeholder?: string
  autoSize?: boolean
  clearable?: boolean
}

const model = defineModel<string>({ default: '' })

withDefaults(defineProps<Props>(), {
  options: () => [],
  border: true,
  size: 'default',
  autoSize: false,
  clearable: false,
})

const emits = defineEmits(['change'])

const { t } = useI18n()

const handleClear = () => {
  model.value = ''
}
</script>

<template>
  <div
    :class="{ border, [size]: true, 'auto-size': autoSize }"
    class="gui-select inline-flex min-w-128 rounded-4"
  >
    <select
      v-model="model"
      @change="emits('change', model)"
      class="cursor-pointer w-full px-8 py-6 outline-none border-0 bg-transparent"
    >
      <option v-if="placeholder" value="">{{ t(placeholder) }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">
        {{ t(o.label) }}
      </option>
    </select>
    <Button
      v-show="clearable && model"
      @click="handleClear"
      icon="close"
      type="text"
      size="small"
    />
  </div>
</template>

<style lang="less" scoped>
.gui-select {
  background: var(--select-bg);
  select {
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
