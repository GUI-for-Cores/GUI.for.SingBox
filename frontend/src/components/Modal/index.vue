<script setup lang="ts">
import { computed, provide, ref } from 'vue'

import { WindowToggleMaximise } from '@/bridge'
import useI18n from '@/lang'

export interface Props {
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
  onOk?: () => MaybePromise<boolean | void>
  onCancel?: () => MaybePromise<boolean | void>
  beforeClose?: (isOk: boolean) => MaybePromise<boolean | void>
  afterClose?: (isOk: boolean) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  footer: true,
  maxHeight: '90',
  maxWidth: '90',
  minWidth: '60',
  minHeight: '',
  width: '',
  height: '',
  cancel: true,
  submit: true,
  cancelText: 'common.cancel',
  submitText: 'common.save',
  maskClosable: false,
})

const open = defineModel('open', { default: false })

const cancelLoading = ref(false)
const submitLoading = ref(false)

const { t } = useI18n.global

const handleAction = async (isOk: boolean) => {
  const loading = isOk ? submitLoading : cancelLoading
  const action = isOk ? props.onOk : props.onCancel

  loading.value = true
  try {
    if (!((await action?.()) ?? true) || !((await props.beforeClose?.(isOk)) ?? true)) {
      return
    }
  } finally {
    loading.value = false
  }

  open.value = false
  props.afterClose?.(isOk)
}

const handleSubmit = () => handleAction(true)
const handleCancel = () => handleAction(false)

const onMaskClick = () => props.maskClosable && handleCancel()

const contentStyle = computed(() => ({
  maxHeight: props.maxHeight + '%',
  maxWidth: props.maxWidth + '%',
  minWidth: props.minWidth + '%',
  minHeight: props.minHeight + '%',
  width: props.width + '%',
  height: props.height + '%',
}))

provide('cancel', handleCancel)
provide('submit', handleSubmit)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" :duration="200">
      <div v-if="open" @click.self="onMaskClick" class="mask" style="--wails-draggable: drag">
        <div :style="contentStyle" class="modal" style="--wails-draggable: false">
          <div
            v-if="title"
            @dblclick="WindowToggleMaximise"
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
            <Button
              v-if="cancel"
              @click="handleCancel"
              :loading="cancelLoading"
              :type="maskClosable ? 'text' : 'normal'"
            >
              {{ t(cancelText) }}
            </Button>
            <Button v-if="submit" @click="handleSubmit" :loading="submitLoading" type="primary">
              {{ t(submitText) }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
