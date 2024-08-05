<script setup lang="ts">
import useI18n from '@/lang'
import { ref, unref } from 'vue'

interface Props {
  title: string
  initialValue?: string | number
  props: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  initialValue: ''
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
    <div class="confirm">
      <div class="title">{{ t(title) }}</div>
      <Input
        v-model="value"
        v-bind="props.props"
        @keydown.enter="handleSubmit"
        :type="props.props.type || type"
        autofocus
        clearable
        auto-size
        size="small"
      />
      <div class="form-action">
        <Button @click="handleCancel" size="small">{{ t('common.cancel') }}</Button>
        <Button @click="handleSubmit" size="small" type="primary">
          {{ t('common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.confirm {
  min-width: 340px;
  max-width: 60%;
  padding: 8px;
  background: var(--toast-bg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 4px;

  .title {
    font-weight: bold;
    padding: 8px 4px;
    word-break: break-all;
  }
}
</style>
