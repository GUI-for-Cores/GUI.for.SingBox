<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: string[]
  options?: { label: string; value: string }[]
  size?: 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  size: 'default'
})

const emits = defineEmits(['update:modelValue'])

const selected = ref(new Set(props.modelValue))

const { t } = useI18n()

const isActive = (val: string) => selected.value.has(val)

const handleSelect = (val: string) => {
  if (isActive(val)) {
    selected.value.delete(val)
  } else {
    selected.value.add(val)
  }
}

watch(selected, (val) => emits('update:modelValue', Array.from(val)), { deep: true })
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
  .checkbox-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
