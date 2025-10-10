<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils'

interface Props {
  modelValue?: string | string[]
  options?: { label: string; value: string }[]
  multiple?: boolean
  border?: boolean
  size?: 'default' | 'small'
  placeholder?: string
  autoSize?: boolean
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  options: () => [],
  multiple: false,
  border: true,
  size: 'default',
  autoSize: false,
  clearable: false,
})

const emit = defineEmits(['change', 'update:modelValue'])

const model = ref(props.multiple ? deepClone(props.modelValue || []) : props.modelValue)

const { t } = useI18n()

const innerClearable = computed(
  () => props.clearable && (props.multiple ? (model.value as string[]).length !== 0 : model.value),
)

const optionsValueLabelMapping = computed(() =>
  props.options.reduce((p, c) => {
    p[c.value] = c.label ?? c.value
    return p
  }, {} as Recordable),
)

const displayLabel = computed(() => {
  if (props.multiple) {
    const selected = model.value as string[]
    if (selected.length === 0) {
      return props.placeholder ?? 'common.none'
    }
    return selected.map((item) => optionsValueLabelMapping.value[item] ?? item).join('、')
  }
  const label = props.options.find((v) => v.value === model.value)?.label ?? (model.value as string)
  return (label || props.placeholder) ?? 'common.none'
})

let internalUpdate = false

watch(
  () => props.modelValue,
  (val) => {
    if (!internalUpdate) {
      model.value = val
    }
    internalUpdate = false
  },
  { deep: true },
)

const isSelected = (val: string) => {
  if (props.multiple) {
    return (model.value as string[]).includes(val)
  }
  return model.value === val
}

const handleSelect = (value: string) => {
  const oldModel = JSON.stringify(model.value)
  if (props.multiple) {
    if (!Array.isArray(model.value)) {
      model.value = []
    }
    const idx = model.value?.indexOf(value) ?? -1
    if (idx === -1) {
      ;(model.value as string[]).push(value)
    } else {
      ;(model.value as string[]).splice(idx, 1)
    }
    if (oldModel !== JSON.stringify(model.value)) {
      emit('update:modelValue', model.value)
      emit('change', model.value)
    }
  } else if (value !== model.value) {
    model.value = value
    emit('update:modelValue', model.value)
    emit('change', model.value)
  }
  internalUpdate = true
}

const handleClear = () => {
  if (props.multiple) {
    model.value = []
    emit('update:modelValue', [])
    emit('change', [])
  } else {
    model.value = ''
    emit('update:modelValue', '')
    emit('change', '')
  }
  internalUpdate = true
}
</script>

<template>
  <Dropdown :trigger="['click']">
    <template #default="{ toggle, close }">
      <div
        :class="{
          border,
          [size]: true,
          'auto-size': autoSize,
          'min-h-28': size === 'small',
          'min-h-30': size === 'default',
        }"
        class="gui-select cursor-pointer inline-flex items-center min-w-128 rounded-4 px-8"
      >
        <span class="line-clamp-1 break-all">
          {{ t(displayLabel) }}
        </span>
        <Button
          :icon="innerClearable ? 'close' : 'arrowDown'"
          @click.stop="
            () => {
              if (innerClearable) {
                handleClear()
                close()
              } else {
                toggle()
              }
            }
          "
          type="text"
          size="small"
          class="ml-auto"
          style="margin-right: -6px"
        />
      </div>
    </template>

    <template #overlay="{ close }">
      <div class="flex flex-col gap-4 min-w-64 p-4">
        <Button
          v-for="o in options"
          :key="o.value"
          @click="
            () => {
              handleSelect(o.value)
              !props.multiple && close()
            }
          "
          type="text"
        >
          <div class="realtive w-full">
            <div v-if="isSelected(o.value)" class="absolute left-8">
              <Icon icon="selected" :size="18" />
            </div>
            <div class="">
              {{ t(o.label) }}
            </div>
          </div>
        </Button>
      </div>
    </template>
  </Dropdown>
</template>

<style lang="less" scoped>
.gui-select {
  background: var(--select-bg);
}

.auto-size {
  width: 100%;
}

.border {
  border: 1px solid var(--primary-color);
}

.small {
  font-size: 12px;
}
</style>
