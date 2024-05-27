<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import useI18n from '@/lang'
import { debounce } from '@/utils'

export interface Props {
  modelValue: string | number
  autoSize?: boolean
  placeholder?: string
  type?: 'number' | 'text'
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
const innerClearable = computed(() => props.clearable && props.modelValue)

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
  <div :class="{ disabled, border, [size]: true }" class="input">
    <div v-if="editable && !showEdit" @click="showInput" class="editable">
      <Icon v-if="disabled" icon="forbidden" class="disabled" />
      {{ modelValue || t('common.none') }}
    </div>
    <template v-else>
      <input
        :class="{ 'auto-size': autoSize, 'pr-clearable': innerClearable }"
        :value="modelValue"
        :placeholder="placeholder"
        :type="type"
        :style="{ width, paddingLeft: pl, paddingRight: pr }"
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
        class="clearable"
      />
    </template>
    <slot name="extra" />
  </div>
</template>

<style lang="less" scoped>
.input {
  display: flex;
  align-items: center;
  .editable {
    cursor: pointer;
    line-height: 30px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 220px;
    .disabled {
      margin-bottom: -2px;
    }
  }
  input {
    width: 100%;
    color: var(--input-color);
    display: inline-block;
    padding: 6px 8px;
    border: none;
    border-radius: 4px;
    background: var(--input-bg);
    margin: 1px;
  }
  .auto-size {
    flex: 1;
    width: calc(100% - 2px);
  }
  .pr-clearable {
    padding-right: 30px !important;
  }
  .clearable {
    margin-left: -30px;
  }
}

.disabled {
  input {
    cursor: not-allowed;
  }
}

.border {
  input {
    outline: 1px solid var(--primary-color);
  }
}

.small {
  input {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>
