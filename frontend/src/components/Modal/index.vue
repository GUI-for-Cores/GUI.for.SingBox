<script lang="ts">
export const IS_IN_MODAL = 'IS_IN_MODAL'
</script>

<script setup lang="ts">
import { computed, markRaw, provide, ref, watch } from 'vue'

import { useBool } from '@/hooks'
import { useAppStore } from '@/stores'
import { message, sampleID } from '@/utils'

export interface Props {
  title?: string
  footer?: boolean
  maxHeight?: string
  maxWidth?: string
  minWidth?: string
  minHeight?: string
  width?: string
  height?: string
  px?: number
  py?: number
  cancel?: boolean
  submit?: boolean
  cancelText?: string
  submitText?: string
  maskClosable?: boolean
  class?: string
  container?: string
  destroyOnClose?: boolean
  toolbar?: {
    maximize?: boolean
    minimize?: boolean
    close?: boolean
  }
  onOk?: () => MaybePromise<boolean | void>
  onCancel?: () => MaybePromise<boolean | void>
  beforeClose?: (isOk: boolean) => MaybePromise<boolean | void>
  afterClose?: (isOk: boolean) => void
  afterDestroy?: () => void
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
  px: 16,
  py: 16,
  cancel: true,
  submit: true,
  cancelText: 'common.cancel',
  submitText: 'common.save',
  maskClosable: false,
  class: undefined,
  container: 'body',
  destroyOnClose: true,
  toolbar: () => ({
    maximize: true,
    minimize: true,
  }),
  onOk: undefined,
  onCancel: undefined,
  beforeClose: undefined,
  afterClose: undefined,
  afterDestroy: undefined,
})

const open = defineModel<boolean>('open', { default: false })

const hasOpened = ref(open.value)
const cancelLoading = ref(false)
const submitLoading = ref(false)

const modalZindex = ref()
const appStore = useAppStore()
const [isMaximize, toggleMaximize] = useBool(false)
const [isMinimize, toggleMinimize] = useBool(false)

let resolveAfterLeave: () => void
let afterLeavePromise: Promise<void>

const handleAction = async (isOk: boolean, waitForAnimation = true) => {
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

  if (waitForAnimation) {
    afterLeavePromise = new Promise((r) => (resolveAfterLeave = r))
    await afterLeavePromise
  }

  props.afterClose?.(isOk)

  if (props.destroyOnClose) {
    props.afterDestroy?.()
    removeMinimizedModal()
  }
}

const onAfterLeave = () => {
  resolveAfterLeave?.()
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

const shouldRender = computed(() => open.value || isMinimize.value || hasOpened.value)

let lastEscTime = 0
let closeMessage: () => void

const closeFn = () => {
  if (isMinimize.value) {
    return
  }
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

const minimizeModal = markRaw({
  id: sampleID(),
  title: () => props.title,
  openFn: () => {
    modalZindex.value = ++appStore.modalZIndexCounter
    open.value = true
    removeMinimizedModal()
  },
  minimizeFn: () => {
    handleMinimize()
  },
  closeFn: () => {
    handleAction(false, false)
  },
})

const removeMinimizedModal = () => {
  const idx = appStore.modalMinimized.findIndex((m) => m === minimizeModal)
  if (idx !== -1) {
    appStore.modalMinimized.splice(idx, 1)
  }
}

const handleMinimize = () => {
  const m = appStore.modalMinimized.includes(minimizeModal)
  if (!m) {
    appStore.modalMinimized.push(minimizeModal)
  }
  open.value = false
  toggleMinimize()
}

watch(open, (v) => {
  if (v) {
    hasOpened.value = true
    isMinimize.value = false
    modalZindex.value = ++appStore.modalZIndexCounter
    appStore.modalStack.push(closeFn)
  } else {
    if (!props.destroyOnClose) {
      handleMinimize()
    }
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

defineExpose({ handleCancel })
</script>

<template>
  <Teleport :to="container">
    <Transition name="modal" :duration="200" @after-leave="onAfterLeave">
      <div
        v-if="shouldRender"
        v-show="open && !isMinimize"
        :style="{ zIndex: modalZindex }"
        class="gui-modal-mask fixed inset-0 flex items-center justify-center backdrop-blur-sm"
        style="--wails-draggable: drag"
        @click.self="onMaskClick"
      >
        <div
          :style="contentStyle"
          :class="props.class"
          class="gui-modal-modal transition duration-200 flex flex-col rounded-8 shadow"
          style="--wails-draggable: false"
        >
          <div
            v-if="title || slots.title || slots.toolbar"
            class="gui-modal-header flex items-center p-16"
            style="--wails-draggable: drag"
            @dblclick.self="toggleMaximize"
          >
            <slot name="title">
              <div v-if="title" class="font-bold">{{ $t(title) }}</div>
            </slot>
            <div class="ml-auto" style="--wails-draggable: false">
              <slot name="toolbar"></slot>
              <Button
                v-if="toolbar.minimize"
                icon="minimize2"
                type="text"
                @click="handleMinimize"
              />
              <Button v-if="toolbar.maximize" type="text" @click="toggleMaximize">
                <Icon
                  :class="{ maximize: isMaximize }"
                  icon="arrowDown"
                  class="maximize-normal origin-center duration-200"
                />
              </Button>
            </div>
          </div>
          <ScrollView :pt="props.py" :pr="props.px" :pb="props.py" :pl="props.px">
            <slot></slot>
          </ScrollView>
          <div
            v-if="footer"
            class="gui-modal-footer flex items-center justify-end py-8 px-16 gap-8"
          >
            <slot name="action"></slot>
            <slot name="cancel">
              <Button
                v-if="cancel"
                :loading="cancelLoading"
                :type="maskClosable ? 'text' : 'normal'"
                @click="handleCancel"
              >
                {{ $t(cancelText) }}
              </Button>
            </slot>
            <slot name="submit">
              <Button v-if="submit" :loading="submitLoading" type="primary" @click="handleSubmit">
                {{ $t(submitText) }}
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

  .gui-modal-header {
    border-bottom: 1px solid var(--divider-color);
  }

  .gui-modal-footer {
    border-top: 1px solid var(--divider-color);
  }
}
.maximize-normal {
  transform: rotate(-180deg);
}
.maximize {
  transform: rotate(0deg);
}
</style>
