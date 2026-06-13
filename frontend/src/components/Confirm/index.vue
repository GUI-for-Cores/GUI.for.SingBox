<script setup lang="ts">
import { computed } from 'vue'

import useI18n from '@/lang'

import MarkdownViewer from '@/components/MarkdownViewer/index.vue'

export type ConfirmOptions = {
  type: 'text' | 'markdown'
  cancelText?: string
  okText?: string
}

interface Props {
  title: string
  message: string | Record<string, any>
  options?: ConfirmOptions
  cancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cancel: true,
  options: () => ({ type: 'text' }),
})

const emits = defineEmits(['confirm', 'cancel', 'finish'])

const { t } = useI18n.global

const content = computed(() => {
  if (typeof props.message !== 'string') {
    return JSON.stringify(props.message, null, 2)
  }
  if (props.options.type === 'text') {
    return t(props.message)
  }
  return props.message
})

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
  <Transition name="slide-down" appear>
    <div class="gui-confirm flex flex-col p-8 rounded-8 shadow">
      <div class="font-bold break-all px-4 py-8">{{ t(title) }}</div>
      <div
        v-if="options.type === 'markdown'"
        class="flex-1 overflow-y-auto text-12 leading-relaxed p-6 break-all whitespace-pre-wrap select-text"
      >
        <MarkdownViewer :content="content" />
      </div>
      <div
        v-else
        class="flex-1 overflow-y-auto text-12 leading-relaxed p-6 break-all whitespace-pre-wrap select-text"
      >
        {{ content }}
      </div>
      <div class="form-action gap-4">
        <Button v-if="cancel" size="small" @click="handleCancel">
          {{ t(options.cancelText || 'common.cancel') }}
        </Button>
        <Button size="small" type="primary" @click="handleConfirm">
          {{ t(options.okText || 'common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-confirm {
  min-width: 340px;
  max-width: 60%;
  background: var(--toast-bg);
}
</style>
