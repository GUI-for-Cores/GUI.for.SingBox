<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBool, useMessage } from '@/hooks'
import { type SubscribeType, useSubscribesStore } from '@/stores'
import { deepClone, sampleID, APP_TITLE, APP_VERSION } from '@/utils'

interface Props {
  id?: string
  isUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false
})

const loading = ref(false)

const sub = ref<SubscribeType>({
  id: sampleID(),
  name: '',
  upload: 0,
  download: 0,
  total: 0,
  expire: '',
  updateTime: '',
  type: 'Http',
  convert: true,
  url: '',
  website: '',
  path: `data/subscribes/${sampleID()}.json`,
  include: '',
  exclude: '',
  proxyPrefix: '',
  disabled: false,
  userAgent: APP_TITLE,
  proxies: []
})

const { t } = useI18n()
const { message } = useMessage()
const [showMore, toggleShowMore] = useBool(false)
const subscribeStore = useSubscribesStore()

const handleCancel = inject('cancel') as any

const handleSubmit = async () => {
  loading.value = true

  try {
    if (props.isUpdate) {
      await subscribeStore.editSubscribe(props.id, sub.value)
    } else {
      await subscribeStore.addSubscribe(sub.value)
    }
    handleCancel()
  } catch (error: any) {
    console.error(error)
    message.info(error)
  }

  loading.value = false
}

const resetUserAgent = () => (sub.value.userAgent = APP_TITLE)
const isManual = () => sub.value.type === 'Manual'

if (props.isUpdate) {
  const s = subscribeStore.getSubscribeById(props.id)
  if (s) {
    sub.value = deepClone(s)
  }
}
</script>

<template>
  <div class="subform">
    <div class="form-item row">
      <div class="name">
        {{ t('subscribes.subtype') }}
      </div>
      <Radio
        v-model="sub.type"
        :options="[
          { label: 'subscribe.http', value: 'Http' },
          { label: 'subscribe.file', value: 'File' },
          { label: 'subscribe.manual', value: 'Manual' }
        ]"
      />
    </div>
    <div v-show="sub.type === 'Http'" class="form-item">
      <div class="name">{{ t('subscribe.convert') }}</div>
      <Switch v-model="sub.convert" />
    </div>
    <div class="form-item">
      <div class="name">* {{ t('subscribe.name') }}</div>
      <Input v-model="sub.name" auto-size autofocus class="input" />
    </div>
    <div v-show="!isManual()" class="form-item">
      <div class="name">* {{ t('subscribe.url') }}</div>
      <Input
        v-model="sub.url"
        :placeholder="sub.type === 'Http' ? 'http(s)://' : 'data/local/{filename}.json'"
        auto-size
        class="input"
      />
    </div>
    <div class="form-item">
      <div class="name">* {{ t('subscribe.path') }}</div>
      <Input
        v-model="sub.path"
        placeholder="data/subscribes/{filename}.json"
        auto-size
        class="input"
      />
    </div>
    <Divider v-show="!isManual()">
      <Button @click="toggleShowMore" type="text" size="small">
        {{ t('common.more') }}
      </Button>
    </Divider>
    <div v-show="showMore && !isManual()">
      <div class="form-item">
        <div class="name">{{ t('subscribe.include') }}</div>
        <Input v-model="sub.include" placeholder="keyword1|keyword2" auto-size class="input" />
      </div>
      <div class="form-item">
        <div class="name">{{ t('subscribe.exclude') }}</div>
        <Input v-model="sub.exclude" placeholder="keyword1|keyword2" auto-size class="input" />
      </div>
      <div class="form-item">
        <div class="name">{{ t('subscribe.proxyPrefix') }}</div>
        <Input v-model="sub.proxyPrefix" auto-size class="input" />
      </div>
      <div v-if="sub.type === 'Http'" class="form-item">
        <div class="name">
          {{ t('subscribe.website') }}
        </div>
        <Input v-model="sub.website" placeholder="http(s)://" auto-size class="input" />
      </div>
      <div class="form-item">
        <div class="name">{{ t('subscribe.useragent') }}</div>
        <div style="display: flex; align-items: center; width: 80%">
          <Input v-model="sub.userAgent" placeholder="" auto-size style="width: 100%" />
          <Button @click="resetUserAgent" v-tips="t('subscribe.resetUserAgent')">
            <Icon icon="reset" fill="var(--primary-btn-color)" />
          </Button>
        </div>
      </div>
    </div>
  </div>
  <div class="action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button
      @click="handleSubmit"
      :loading="loading"
      :disable="!sub.name || !sub.path || (!sub.url && sub.type !== 'Manual')"
      type="primary"
    >
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.subform {
  .name {
    font-size: 14px;
    padding: 8px 0;
    white-space: nowrap;
  }
  .input {
    width: 80%;
  }
  .row {
    display: flex;
    align-items: center;
    .name {
      margin-right: 8px;
    }
  }
}
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
