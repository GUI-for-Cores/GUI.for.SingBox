<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'

import useI18n from '@/lang'
import { debounce } from '@/utils'

export interface Props {
  modelValue?: string | number | undefined
  autoSize?: boolean
  placeholder?: string
  type?: 'number' | 'text' | 'code'
  lang?: 'yaml' | 'json' | 'javascript'
  size?: 'default' | 'small'
  editable?: boolean
  clearable?: boolean
  autofocus?: boolean
  min?: number
  max?: number
  disabled?: boolean
  border?: boolean
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  autoSize: false,
  placeholder: undefined,
  type: 'text',
  lang: 'javascript',
  size: 'default',
  editable: false,
  autofocus: false,
  min: undefined,
  max: undefined,
  clearable: false,
  disabled: false,
  border: true,
  delay: 0,
})

const emits = defineEmits(['change', 'update:modelValue', 'submit'])

const showEdit = ref(false)
const inputRef = useTemplateRef('inputRef')
const innerClearable = computed(
  () => props.clearable && props.type !== 'code' && props.modelValue && !props.disabled,
)

const { t } = useI18n.global

const validate = (val: string | number) => {
  if (props.type === 'number') {
    val = Number(val)
    const { min, max } = props
    if (min !== undefined) {
      val = val < min ? min : val
    }
    if (max !== undefined) {
      val = val > max ? max : val
    }
  }
  return val
}

const onInput = debounce((e: any) => {
  const val = validate(e.target.value)
  e.target.value = val
  emits('update:modelValue', val)
  emits('change', val)
}, props.delay)

const handleClear = () => {
  const val = props.type === 'number' ? Math.min(props.min || 0, 0) : ''
  emits('update:modelValue', val)
  emits('change', val)
  !props.editable && nextTick(() => inputRef.value?.focus())
}

const showInput = () => {
  if (props.disabled) return
  showEdit.value = true
  nextTick(() => inputRef.value?.focus())
}

const onSubmit = debounce(
  (e: any) => {
    const val = validate(e.target.value)
    e.target.value = val
    emits('submit', val)
    props.editable && (showEdit.value = false)
  },
  props.clearable ? 100 : 0,
)

onMounted(() => props.autofocus && !props.editable && inputRef.value?.focus())

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<template>
  <div
    v-bind="$attrs"
    :class="{
      border: border && (!editable || showEdit),
      'auto-size': autoSize,
      'bg-color': !editable || showEdit,
      'is-editable': editable && !showEdit,
      [size]: true,
      disabled,
    }"
    :style="{
      height: type === 'code' ? '' : size === 'small' ? '26px' : '30px',
    }"
    class="gui-input inline-flex items-center rounded-4 cursor-pointer px-4"
  >
    <div v-if="$slots.prefix" class="flex items-center shrink-0">
      <slot name="prefix" v-bind="{ showInput }"></slot>
    </div>
    <Icon v-if="disabled" icon="forbidden" class="shrink-0" />
    <div
      v-if="editable && !showEdit"
      class="w-full overflow-hidden whitespace-nowrap text-ellipsis"
      @click="showInput"
    >
      <slot name="editable" v-bind="{ value: modelValue }">
        {{ modelValue || t(placeholder || 'common.none') }}
      </slot>
    </div>
    <template v-else>
      <CodeViewer
        v-if="type === 'code'"
        :value="modelValue"
        :lang="lang"
        :editable="!disabled"
        :placeholder="placeholder"
        class="code w-full overflow-y-auto"
        @change="(value: string) => onInput({ target: { value } })"
      />
      <input
        v-else
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        :type="type"
        :disabled="disabled"
        autocomplete="off"
        class="flex-1 inline-block py-6 outline-none border-0 bg-transparent w-0"
        @input="onInput"
        @blur="onSubmit"
        @keydown.enter="inputRef?.blur"
        @keydown.esc.stop.prevent="inputRef?.blur"
      />
      <Button
        v-if="innerClearable"
        :icon-size="12"
        icon="clear2"
        type="text"
        size="small"
        @click="handleClear"
      />
    </template>
    <div v-if="$slots.suffix" class="flex items-center shrink-0">
      <slot name="suffix" v-bind="{ showInput }"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-input {
  min-width: 220px;
  border: 1px solid transparent;
  input {
    color: var(--input-color);
  }
  .code {
    max-height: 300px;
  }
}

.bg-color {
  background: var(--input-bg);
}

.is-editable {
  min-width: 0;
  max-width: 220px;
}

.auto-size {
  min-width: 0 !important;
}

.disabled {
  cursor: not-allowed;
  input {
    cursor: not-allowed;
  }
}

.border {
  border: 1px solid var(--primary-color);
}

.small {
  input {
    font-size: 12px;
  }
}
</style>
