<script setup lang="ts">
import { ref, inject, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { RequestMethodOptions } from '@/constant/app'
import { useBool } from '@/hooks'
import { useSubscribesStore } from '@/stores'
import { deepClone, message } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { Subscription } from '@/types/app'

interface Props {
  id?: string
}

const props = defineProps<Props>()

const { t } = useI18n()
const [showMore, toggleShowMore] = useBool(false)
const subscribeStore = useSubscribesStore()

const loading = ref(false)
const sub = ref<Subscription>(subscribeStore.getSubscribeTemplate())

const isManual = computed(() => sub.value.type === 'Manual')
const isRemote = computed(() => sub.value.type === 'Http')

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true

  try {
    if (props.id) {
      await subscribeStore.editSubscribe(props.id, sub.value)
    } else {
      await subscribeStore.addSubscribe(sub.value)
    }
    await handleSubmit()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }

  loading.value = false
}

if (props.id) {
  const s = subscribeStore.getSubscribeById(props.id)
  if (s) {
    sub.value = deepClone(s)
  }
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
        disabled: !sub.value.name || !sub.value.path || (!sub.value.url && !isManual.value),
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div>
    <div class="form-item">
      {{ t('subscribes.subtype') }}
      <Radio
        v-model="sub.type"
        :options="[
          { label: 'common.http', value: 'Http' },
          { label: 'common.file', value: 'File' },
          { label: 'subscribe.manual', value: 'Manual' },
        ]"
      />
    </div>
    <div class="form-item">
      {{ t('subscribe.name') }} *
      <div class="min-w-[75%]">
        <Input v-model="sub.name" autofocus class="w-full" />
      </div>
    </div>
    <div v-if="!isManual" class="form-item">
      {{ t(sub.type === 'Http' ? 'subscribe.url' : 'subscribe.localPath') }} *
      <div class="min-w-[75%]">
        <Input
          v-model="sub.url"
          :placeholder="sub.type === 'Http' ? 'http(s)://' : 'data/local/{filename}.json'"
          class="w-full"
        />
      </div>
    </div>
    <div class="form-item">
      {{ t('subscribe.path') }} *
      <div class="min-w-[75%]">
        <Input v-model="sub.path" placeholder="data/subscribes/{filename}.json" class="w-full" />
      </div>
    </div>
    <Divider v-if="!isManual">
      <Button @click="toggleShowMore" type="text" size="small">
        {{ t('common.more') }}
      </Button>
    </Divider>
    <div v-if="showMore && !isManual">
      <div class="form-item">
        {{ t('subscribe.include') }}
        <div class="min-w-[75%]">
          <Input v-model="sub.include" placeholder="keyword1|keyword2" class="w-full" />
        </div>
      </div>
      <div class="form-item">
        {{ t('subscribe.exclude') }}
        <div class="min-w-[75%]">
          <Input v-model="sub.exclude" placeholder="keyword1|keyword2" class="w-full" />
        </div>
      </div>
      <div class="form-item">
        {{ t('subscribe.includeProtocol') }}
        <div class="min-w-[75%]">
          <Input
            v-model="sub.includeProtocol"
            placeholder="direct|mixed|socks|http..."
            class="w-full"
          />
        </div>
      </div>
      <div class="form-item">
        {{ t('subscribe.excludeProtocol') }}
        <div class="min-w-[75%]">
          <Input
            v-model="sub.excludeProtocol"
            placeholder="direct|mixed|socks|http..."
            class="w-full"
          />
        </div>
      </div>
      <div class="form-item">
        {{ t('subscribe.proxyPrefix') }}
        <div class="min-w-[75%]">
          <Input v-model="sub.proxyPrefix" class="w-full" />
        </div>
      </div>
      <template v-if="isRemote">
        <div class="form-item">
          {{ t('subscribe.website') }}
          <div class="min-w-[75%]">
            <Input v-model="sub.website" placeholder="http(s)://" class="w-full" />
          </div>
        </div>
        <div class="form-item">
          {{ t('subscribe.inSecure') }}
          <Switch v-model="sub.inSecure" />
        </div>
        <div class="form-item">
          {{ t('subscribe.requestTimeout') }}
          <Input v-model="sub.requestTimeout" type="number" :min="3" :max="180" />
        </div>
        <div class="form-item">
          {{ t('subscribe.requestMethod') }}
          <Radio v-model="sub.requestMethod" :options="RequestMethodOptions" />
        </div>
        <div
          :class="{ 'items-start': Object.keys(sub.header.request).length !== 0 }"
          class="form-item"
        >
          {{ t('subscribe.header.request') }}
          <KeyValueEditor v-model="sub.header.request" />
        </div>
        <div
          :class="{ 'items-start': Object.keys(sub.header.response).length !== 0 }"
          class="form-item"
        >
          {{ t('subscribe.header.response') }}
          <KeyValueEditor v-model="sub.header.response" />
        </div>
      </template>
    </div>
  </div>
</template>
