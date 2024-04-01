<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, provide } from 'vue'

import { toggleFullScreen } from '@/utils'

interface Props {
  open: boolean
  title?: string
  footer?: boolean
  maxHeight?: string
  maxWidth?: string
  minWidth?: string
  minHeight?: string
  width?: string
  height?: string
  cancel?: boolean
  submit?: boolean
  cancelText?: string
  submitText?: string
  maskClosable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  footer: true,
  maxHeight: '',
  maxWidth: '',
  minWidth: '60',
  minHeight: '',
  width: '',
  height: '',
  cancel: true,
  submit: true,
  cancelText: 'common.cancel',
  submitText: 'common.save',
  maskClosable: false
})

const { t } = useI18n()

const emits = defineEmits(['update:open', 'ok'])

const handleSubmit = () => {
  emits('update:open', false)
  emits('ok')
}

const handleCancel = () => emits('update:open', false)

const onMaskClick = () => props.maskClosable && handleCancel()

const contentStyle = computed(() => ({
  maxHeight: props.maxHeight + '%',
  maxWidth: props.maxWidth + '%',
  minWidth: props.minWidth + '%',
  minHeight: props.minHeight + '%',
  width: props.width + '%',
  height: props.height + '%'
}))

provide('cancel', handleCancel)
provide('submit', handleSubmit)
</script>

<template>
  <Transition name="modal" :duration="200">
    <div v-if="open" @click.self="onMaskClick" class="mask" style="--wails-draggable: drag">
      <div :style="contentStyle" class="modal" style="--wails-draggable: false">
        <div
          v-if="title"
          @dblclick="toggleFullScreen"
          class="title"
          style="--wails-draggable: drag"
        >
          {{ t(title) }}
        </div>
        <div class="content">
          <slot />
        </div>
        <div v-if="footer" class="action">
          <slot name="action" />
          <Button v-if="cancel" @click="handleCancel" type="text">{{ t(cancelText) }}</Button>
          <Button v-if="submit" @click="handleSubmit" type="primary">{{ t(submitText) }}</Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition:
    transform 0.2s ease-in-out,
    opacity 0.2s ease-in-out;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: scale(0);
}

.mask {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--modal-mask-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 999;

  .modal {
    display: flex;
    flex-direction: column;
    background-color: var(--modal-bg);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    .title {
      padding: 16px;
      font-size: 14px;
      font-weight: bold;
    }
    .content {
      overflow-y: auto;
      margin: 0 8px 8px 8px;
      padding: 0 8px;
      flex: 1;
    }
    .action {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
      padding: 0 16px 0 0;
    }
  }
}
</style>
