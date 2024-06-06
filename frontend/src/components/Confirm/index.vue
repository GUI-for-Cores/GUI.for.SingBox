<script setup lang="ts">
import useI18n from '@/lang'

interface Props {
  title: string
  message: string | Record<string, any>
  cancel?: boolean
}

const props = withDefaults(defineProps<Props>(), { cancel: true })

const emits = defineEmits(['confirm', 'cancel', 'finish'])

const { t } = useI18n.global

const handleConfirm = () => {
  emits('confirm', true)
  emits('finish')
}

const handleCancel = () => {
  emits('cancel')
  emits('finish')
}

const getMessage = () => {
  if (typeof props.message === 'string') {
    return t(props.message)
  }
  return props.message
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="confirm">
      <div class="title">{{ t(title) }}</div>
      <div class="message select-text">{{ getMessage() }}</div>
      <div class="form-action">
        <Button v-if="cancel" @click="handleCancel" size="small">{{ t('common.cancel') }}</Button>
        <Button @click="handleConfirm" size="small" type="primary">
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
  .message {
    font-size: 12px;
    line-height: 1.6;
    padding: 6px;
    word-break: break-all;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>
