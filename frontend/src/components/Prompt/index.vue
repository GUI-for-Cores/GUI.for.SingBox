<script setup lang="ts">
import { ref, unref } from 'vue'

import useI18n from '@/lang'

import { type Props as InputProps } from '@/components/Input/index.vue'

interface Props {
  title: string
  initialValue?: string | number
  props: Omit<InputProps, 'modelValue'>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  initialValue: '',
})

const emits = defineEmits(['submit', 'cancel', 'finish'])

const type = typeof props.initialValue === 'string' ? 'text' : 'number'
const value = ref(props.initialValue)

const { t } = useI18n.global

const handleSubmit = (e: Event) => {
  if (e.type === 'keydown' && props.props.type === 'code') return
  emits('submit', unref(value))
  emits('finish')
}

const handleCancel = () => {
  emits('cancel')
  emits('finish')
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="gui-confirm p-8 rounded-8 shadow max-w-[60%]">
      <div class="font-bold break-all px-4 py-8">{{ t(title) }}</div>
      <Input
        v-model="value"
        v-bind="props.props"
        @keydown.enter="handleSubmit"
        :type="props.props.type || type"
        autofocus
        clearable
        size="small"
        class="w-full"
      />
      <div class="form-action gap-4">
        <Button @click="handleCancel" size="small">{{ t('common.cancel') }}</Button>
        <Button @click="handleSubmit" size="small" type="primary">
          {{ t('common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-confirm {
  min-width: 340px;
  background: var(--toast-bg);
}
</style>
