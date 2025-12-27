<script lang="ts" setup>
import { useTemplateRef } from 'vue'

const model = defineModel<string>({ default: '#000' })

const emit = defineEmits(['change'])

const inputRef = useTemplateRef('inputRef')

const onChange = (v: Event) => {
  const val = (v.target as HTMLInputElement).value
  emit('change', val)
}

const pick = () => {
  inputRef.value?.click()
}
</script>

<template>
  <div
    :class="{ 'pl-8': $slots.prefix, 'pr-8': $slots.suffix }"
    class="gui-color-picker rounded-full inline-flex items-center overflow-hidden"
  >
    <div v-if="$slots.prefix" class="flex items-center line-clamp-1 break-all">
      <slot name="prefix" v-bind="{ pick }"></slot>
    </div>
    <input
      ref="inputRef"
      v-model="model"
      @change="(e) => onChange(e)"
      type="color"
      class="w-26 h-28 flex justify-center items-center border-0 bg-transparent cursor-pointer"
    />
    <div v-if="$slots.suffix" class="flex items-center line-clamp-1 break-all">
      <slot name="suffix" v-bind="{ pick }"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-color-picker {
  color: var(--color);
  border: 1px solid var(--primary-color);
  background: var(--color-picker-bg);
}

input::-webkit-color-swatch-wrapper {
  padding: 0;
  width: 16px;
  height: 16px;
}

input::-webkit-color-swatch {
  border-radius: 6px;
  border: none;
}
</style>
