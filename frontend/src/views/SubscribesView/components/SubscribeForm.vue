<script setup lang="ts">
import { ref, inject, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { DefaultSubscribeScript, RequestMethodOptions } from '@/constant/app'
import { DefaultExcludeProtocols } from '@/constant/kernel'
import { RequestMethod } from '@/enums/app'
import { useBool } from '@/hooks'
import { useSubscribesStore } from '@/stores'
import { deepClone, sampleID, message } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { Subscription } from '@/types/app'

interface Props {
  id?: string
}

const props = defineProps<Props>()

const loading = ref(false)

const sub = ref<Subscription>({
  id: sampleID(),
  name: '',
  upload: 0,
  download: 0,
  total: 0,
  expire: 0,
  updateTime: 0,
  type: 'Http',
  url: '',
  website: '',
  path: `data/subscribes/${sampleID()}.json`,
  include: '',
  exclude: '',
  includeProtocol: '',
  excludeProtocol: DefaultExcludeProtocols,
  proxyPrefix: '',
  disabled: false,
  inSecure: false,
  requestMethod: RequestMethod.Get,
  header: {
    request: {},
    response: {},
  },
  proxies: [],
  script: DefaultSubscribeScript,
})

const isManual = computed(() => sub.value.type === 'Manual')
const isRemote = computed(() => sub.value.type === 'Http')

const { t } = useI18n()
const [showMore, toggleShowMore] = useBool(false)
const subscribeStore = useSubscribesStore()

const handleCancel = inject('cancel') as any

const handleSubmit = async () => {
  loading.value = true

  try {
    if (props.id) {
      await subscribeStore.editSubscribe(props.id, sub.value)
    } else {
      await subscribeStore.addSubscribe(sub.value)
    }
    handleCancel()
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
        onClick: handleSubmit,
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
      <Input v-model="sub.name" autofocus class="min-w-[75%]" />
    </div>
    <div v-if="!isManual" class="form-item">
      {{ t(sub.type === 'Http' ? 'subscribe.url' : 'subscribe.localPath') }} *
      <Input
        v-model="sub.url"
        :placeholder="sub.type === 'Http' ? 'http(s)://' : 'data/local/{filename}.json'"
        class="min-w-[75%]"
      />
    </div>
    <div class="form-item">
      {{ t('subscribe.path') }} *
      <Input v-model="sub.path" placeholder="data/subscribes/{filename}.json" class="min-w-[75%]" />
    </div>
    <Divider v-if="!isManual">
      <Button @click="toggleShowMore" type="text" size="small">
        {{ t('common.more') }}
      </Button>
    </Divider>
    <div v-if="showMore && !isManual">
      <div class="form-item">
        {{ t('subscribe.include') }}
        <Input v-model="sub.include" placeholder="keyword1|keyword2" class="min-w-[75%]" />
      </div>
      <div class="form-item">
        {{ t('subscribe.exclude') }}
        <Input v-model="sub.exclude" placeholder="keyword1|keyword2" class="min-w-[75%]" />
      </div>
      <div class="form-item">
        {{ t('subscribe.includeProtocol') }}
        <Input
          v-model="sub.includeProtocol"
          placeholder="direct|mixed|socks|http..."
          class="min-w-[75%]"
        />
      </div>
      <div class="form-item">
        {{ t('subscribe.excludeProtocol') }}
        <Input
          v-model="sub.excludeProtocol"
          placeholder="direct|mixed|socks|http..."
          class="min-w-[75%]"
        />
      </div>
      <div class="form-item">
        {{ t('subscribe.proxyPrefix') }}
        <Input v-model="sub.proxyPrefix" class="min-w-[75%]" />
      </div>
      <template v-if="isRemote">
        <div class="form-item">
          {{ t('subscribe.website') }}
          <Input v-model="sub.website" placeholder="http(s)://" class="min-w-[75%]" />
        </div>
        <div class="form-item">
          {{ t('subscribe.inSecure') }}
          <Switch v-model="sub.inSecure" />
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
