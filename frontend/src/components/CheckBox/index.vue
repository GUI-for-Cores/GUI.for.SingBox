<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: string[]
  options?: { label: string; value: string }[]
  size?: 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  options: () => [],
  size: 'default',
})

const emit = defineEmits(['change', 'update:modelValue'])

const model = ref<string[]>([...props.modelValue])
const { t } = useI18n()

watch(
  () => props.modelValue,
  (newVal) => {
    model.value = [...newVal]
  },
)

const isActive = (val: string) => model.value.includes(val)

const handleSelect = (val: string) => {
  const idx = model.value.findIndex((v) => v === val)
  if (idx !== -1) {
    model.value.splice(idx, 1)
  } else {
    model.value.push(val)
  }
  emit('update:modelValue', [...model.value])
  emit('change', [...model.value])
}
</script>

<template>
  <div :class="[size]" class="gui-checkbox inline-flex rounded-8 overflow-hidden text-12">
    <div
      v-for="o in props.options"
      :key="o.value"
      @click="handleSelect(o.value)"
      :class="{ active: isActive(o.value) }"
      class="gui-checkbox-button cursor-pointer px-12 py-6 transition duration-200 line-clamp-1 break-all"
    >
      {{ t(o.label) }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-checkbox {
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
  .gui-checkbox-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
