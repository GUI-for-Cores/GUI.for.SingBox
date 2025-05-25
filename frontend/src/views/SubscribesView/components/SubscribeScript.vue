<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, inject } from 'vue'

import type { Subscription } from '@/types/app'

import { message } from '@/utils'
import { useSubscribesStore } from '@/stores'

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
</script>

<template>
  <div class="script-view">
    <CodeViewer v-model="code" lang="javascript" editable />
  </div>
  <div class="form-action">
    <Button @click="handleCancel" :disabled="loading">
      {{ t('common.cancel') }}
    </Button>
    <Button @click="handleSave" :loading="loading" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.script-view {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  overflow-y: auto;
  max-height: 70vh;
}
</style>
