<script lang="ts">
export const IS_IN_MODAL = 'IS_IN_MODAL'
</script>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'

import { useBool } from '@/hooks'
import useI18n from '@/lang'
import { useAppStore } from '@/stores'
import { message } from '@/utils'

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
  class?: string
  toolbar?: {
    maximize?: boolean
    minimize?: boolean
    close?: boolean
  }
  onOk?: () => MaybePromise<boolean | void>
  onCancel?: () => MaybePromise<boolean | void>
  beforeClose?: (isOk: boolean) => MaybePromise<boolean | void>
  afterClose?: (isOk: boolean) => void
}

export interface Slots {
  default?: () => any
  title?: () => any
  toolbar?: () => any
  action?: () => any
  cancel?: () => any
  submit?: () => any
}

const slots = defineSlots<Slots>()

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
  toolbar: () => ({
    maximize: true,
    minimize: true,
  }),
})

const open = defineModel('open', { default: false })

const cancelLoading = ref(false)
const submitLoading = ref(false)

const modalZindex = ref()
const appStore = useAppStore()
const [isMaximize, toggleMaximize] = useBool(false)
// const [isMinimize, toggleMinimize] = useBool(false)

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
  minWidth: isMaximize.value ? '100%' : props.minWidth ? props.minWidth + '%' : '0',
  minHeight: isMaximize.value ? '100%' : props.minHeight ? props.minHeight + '%' : '0',
  width: props.width + '%',
  height: props.height + '%',
}))

let lastEscTime = 0
let closeMessage: () => void

const closeFn = () => {
  if (isMaximize.value) {
    toggleMaximize()
    return
  }
  if (props.maskClosable) {
    handleCancel()
    return
  }
  const now = performance.now()
  if (now - lastEscTime < 1000) {
    handleCancel()
    lastEscTime = 0
    closeMessage?.()
  } else {
    const { destroy } = message.info('common.pressAgainToClose', 1_000)
    closeMessage = destroy
    lastEscTime = now
  }
}

watch(open, (v) => {
  if (v) {
    modalZindex.value = ++appStore.modalZIndexCounter
    appStore.modalStack.push(closeFn)
  } else {
    closeMessage?.()
    const idx = appStore.modalStack.findIndex((fn) => fn === closeFn)
    if (idx !== -1) {
      appStore.modalStack.splice(idx, 1)
    }
  }
})

provide('cancel', handleCancel)
provide('submit', handleSubmit)
provide(IS_IN_MODAL, true)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" :duration="200">
      <div
        v-if="open"
        @click.self="onMaskClick"
        :style="{ zIndex: modalZindex }"
        class="gui-modal-mask fixed inset-0 flex items-center justify-center backdrop-blur-sm"
        style="--wails-draggable: drag"
      >
        <div
          :style="contentStyle"
          :class="props.class"
          class="gui-modal-modal transition duration-200 flex flex-col rounded-8 shadow"
          style="--wails-draggable: false"
        >
          <div
            v-if="title || slots.title || slots.toolbar"
            @dblclick="toggleMaximize"
            class="flex items-center p-16"
            style="--wails-draggable: drag"
          >
            <slot name="title">
              <div v-if="title" class="font-bold">{{ t(title) }}</div>
            </slot>
            <div class="ml-auto" style="--wails-draggable: false">
              <slot name="toolbar"></slot>
              <!-- <Button v-if="toolbar.minimize" @click="toggleMinimize" icon="minimize" type="text" /> -->
              <Button v-if="toolbar.maximize" @click="toggleMaximize" type="text">
                <Icon
                  :class="{ maximize: isMaximize }"
                  icon="arrowDown"
                  class="maximize-normal origin-center duration-200"
                />
              </Button>
            </div>
          </div>
          <div class="flex-1 overflow-auto mx-16">
            <slot></slot>
          </div>
          <div v-if="footer" class="flex items-center justify-end py-8 px-16 gap-8">
            <slot name="action"></slot>
            <slot name="cancel">
              <Button
                v-if="cancel"
                @click="handleCancel"
                :loading="cancelLoading"
                :type="maskClosable ? 'text' : 'normal'"
              >
                {{ t(cancelText) }}
              </Button>
            </slot>
            <slot name="submit">
              <Button v-if="submit" @click="handleSubmit" :loading="submitLoading" type="primary">
                {{ t(submitText) }}
              </Button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="less" scoped>
.modal-enter-active .gui-modal-modal,
.modal-leave-active .gui-modal-modal {
  transition:
    transform 0.2s ease-in-out,
    opacity 0.2s ease-in-out;
}

.modal-enter-from .gui-modal-modal,
.modal-leave-to .gui-modal-modal {
  opacity: 0;
  transform: scale(0);
}

.gui-modal-mask {
  background-color: var(--modal-mask-bg);

  .gui-modal-modal {
    background-color: var(--modal-bg);
  }
}
.maximize-normal {
  transform: rotate(-180deg);
}
.maximize {
  transform: rotate(0deg);
}
</style>
