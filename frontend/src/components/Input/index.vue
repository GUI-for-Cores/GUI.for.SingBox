<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import useI18n from '@/lang'
import { debounce } from '@/utils'

export interface Props {
  modelValue: string | number
  autoSize?: boolean
  placeholder?: string
  type?: 'number' | 'text' | 'code'
  lang?: 'yaml' | 'json' | 'javascript'
  size?: 'default' | 'small'
  editable?: boolean
  clearable?: boolean
  autofocus?: boolean
  width?: string
  min?: number
  max?: number
  disabled?: boolean
  border?: boolean
  delay?: number
  pl?: string
  pr?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoSize: false,
  type: 'text',
  lang: 'javascript',
  size: 'default',
  editable: false,
  autofocus: false,
  clearable: false,
  width: '',
  disabled: false,
  border: true,
  delay: 0,
  pl: '8px',
  pr: '8px'
})

const emits = defineEmits(['update:modelValue', 'submit'])

const showEdit = ref(false)
const inputRef = ref<HTMLElement>()
const innerClearable = computed(() => props.clearable && props.type !== 'code' && props.modelValue)

const { t } = useI18n.global

const onInput = debounce((e: any) => {
  let val = e.target.value
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
  emits('update:modelValue', val)
}, props.delay)

const handleClear = () => {
  emits('update:modelValue', props.type === 'number' ? 0 : '')
}

const showInput = () => {
  if (props.disabled) return
  showEdit.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const onSubmit = () => {
  setTimeout(
    () => {
      emits('submit', props.modelValue)
      props.editable && (showEdit.value = false)
    },
    props.clearable ? 100 : 0
  )
}

onMounted(() => props.autofocus && inputRef.value?.focus())

defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<template>
  <div
    :class="{
      disabled,
      border: (border && !editable) || showEdit,
      'auto-size': autoSize,
      'limit-width': !autoSize && (!editable || showEdit),
      'bg-color': !editable || showEdit,
      [size]: true
    }"
    :style="{
      height: type === 'code' ? '' : size === 'small' ? '26px' : '30px'
    }"
    class="input"
  >
    <div v-if="editable && !showEdit" @click="showInput" class="editable">
      <Icon v-if="disabled" icon="forbidden" class="disabled" />
      {{ modelValue || t('common.none') }}
    </div>
    <template v-else>
      <CodeViewer
        v-if="type === 'code'"
        @change="(value: string) => onInput({ target: { value } })"
        :value="modelValue"
        :lang="lang"
        :editable="!disabled"
        class="code"
      />
      <input
        v-else
        :value="modelValue"
        :placeholder="placeholder"
        :type="type"
        :style="{
          width: !autoSize ? '0' : width,
          paddingLeft: pl,
          paddingRight: clearable ? '0' : pr
        }"
        :disabled="disabled"
        @input="($event) => onInput($event)"
        @blur="onSubmit"
        @keydown.enter="inputRef?.blur"
        autocomplete="off"
        ref="inputRef"
      />
      <Button
        v-if="innerClearable"
        @click="handleClear"
        :icon-size="12"
        icon="clear2"
        type="text"
        size="small"
      />
    </template>
    <slot name="extra"></slot>
  </div>
</template>

<style lang="less" scoped>
.input {
  display: flex;
  align-items: center;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid transparent;
  .editable {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 210px;
    .disabled {
      margin-bottom: -2px;
      flex-shrink: 0;
    }
  }
  input {
    flex: 1;
    color: var(--input-color);
    display: inline-block;
    padding: 6px 0;
    border: none;
    outline: none;
    background: transparent;
  }
  .code {
    width: 100%;
    max-height: 300px;
    overflow-y: auto;
  }
}

.bg-color {
  background: var(--input-bg);
}

.limit-width {
  width: 210px;
}

.auto-size {
  min-width: 0 !important;
}

.disabled {
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
