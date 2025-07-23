<script setup lang="ts">
import { ref, inject, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSubscribesStore } from '@/stores'
import { message } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { Subscription } from '@/types/app'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const subscribe = ref<Subscription>()
const code = ref('')

const { t } = useI18n()
const subscribeStore = useSubscribesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  if (!subscribe.value) return
  loading.value = true
  try {
    subscribe.value.script = code.value
    await subscribeStore.editSubscribe(props.id, subscribe.value)
    handleSubmit()
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
  loading.value = false
}

const s = subscribeStore.getSubscribeById(props.id)
if (s) {
  subscribe.value = s
  code.value = s.script
}

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div>
    <CodeViewer v-model="code" lang="javascript" editable />
  </div>
</template>
