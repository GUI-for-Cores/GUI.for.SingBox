<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { nextTick, onMounted, ref } from 'vue'

import { debounce } from '@/utils'

interface Props {
  modelValue: string | number
  autoSize?: boolean
  placeholder?: string
  type?: 'number' | 'text'
  editable?: boolean
  autofocus?: boolean
  width?: string
  min?: number
  max?: number
  disabled?: boolean
  border?: boolean
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoSize: false,
  type: 'text',
  editable: false,
  autofocus: false,
  width: '',
  disabled: false,
  border: true,
  delay: 0
})

const emits = defineEmits(['update:modelValue', 'submit'])

const showEdit = ref(false)
const inputRef = ref<HTMLElement>()

const { t } = useI18n()

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

const showInput = () => {
  showEdit.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const onSubmit = () => {
  props.editable && (showEdit.value = false)
  emits('submit', props.modelValue)
}

onMounted(() => props.autofocus && inputRef.value?.focus())

defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<template>
  <div :class="{ disabled, border }" class="input">
    <div v-if="editable && !showEdit" @click="showInput" class="editable">
      <Icon v-if="disabled" icon="forbidden" class="disabled" />
      {{ modelValue || t('common.none') }}
    </div>
    <input
      v-else
      :class="{ 'auto-size': autoSize }"
      :value="modelValue"
      :placeholder="placeholder"
      :type="type"
      :style="width && 'width: ' + width"
      :disabled="disabled"
      @input="($event) => onInput($event)"
      @blur="onSubmit"
      @keydown.enter="inputRef?.blur"
      ref="inputRef"
    />
  </div>
</template>

<style lang="less" scoped>
.input {
  .editable {
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
    width: calc(100% - 2px);
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
</style>
