<script setup lang="ts">
import useI18n from '@/lang'

interface Props {
  title: string
  message: string
}

defineProps<Props>()

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
</script>

<template>
  <div class="confirm">
    <div class="title">{{ title }}</div>
    <div class="message">{{ message }}</div>
    <div class="form-action">
      <Button @click="handleCancel" size="small">{{ t('common.cancel') }}</Button>
      <Button @click="handleConfirm" size="small" type="primary">
        {{ t('common.confirm') }}
      </Button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.confirm {
  min-width: 340px;
  max-width: 60%;
  padding: 8px;
  background: var(--modal-bg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 4px;

  .title {
    font-weight: bold;
    padding: 8px 4px;
    word-break: break-all;
  }
  .message {
    font-size: 12px;
    padding: 6px;
    word-break: break-all;
  }
}
</style>
