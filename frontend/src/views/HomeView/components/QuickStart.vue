<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, inject, ref } from 'vue'

import { useMessage } from '@/hooks'
import * as Defaults from '@/constant/profile'
import { sampleID } from '@/utils'
import { DefaultExcludeProtocols } from '@/constant/kernel'
import {
  useProfilesStore,
  useAppSettingsStore,
  useSubscribesStore,
  type SubscribeType,
} from '@/stores'

const { t } = useI18n()
const { message } = useMessage()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()

const url = ref('')
const loading = ref(false)

const handleCancel = inject('cancel') as any

const canSubmit = computed(() => url.value && url.value.toLocaleLowerCase().startsWith('http'))

const handleSubmit = async () => {
  const subscribeID = sampleID()

  const subscribe: SubscribeType = {
    id: subscribeID,
    name: subscribeID,
    url: url.value,
    upload: 0,
    download: 0,
    total: 0,
    expire: 0,
    updateTime: 0,
    type: 'Http',
    website: '',
    path: `data/subscribes/${subscribeID}.json`,
    include: '',
    exclude: '',
    includeProtocol: '',
    excludeProtocol: DefaultExcludeProtocols,
    proxyPrefix: '',
    disabled: false,
    inSecure: false,
    userAgent: '',
    proxies: [],
  }

  loading.value = true

  try {
    await subscribeStore.addSubscribe(subscribe)
    await subscribeStore.updateSubscribe(subscribeID)
  } catch (error: any) {
    loading.value = false
    console.log(error)
    message.error(error)
    subscribeStore.deleteSubscribe(subscribeID)
    return
  }

  const profile: IProfile = {
    id: sampleID(),
    name: sampleID(),
    log: Defaults.DefaultLog(),
    experimental: Defaults.DefaultExperimental(),
    inbounds: Defaults.DefaultInbounds(),
    outbounds: Defaults.DefaultOutbounds(),
    route: Defaults.DefaultRoute(),
    dns: Defaults.DefaultDns(),
    mixin: Defaults.DefaultMixin(),
    script: Defaults.DefaultScript(),
  }

  profile.outbounds[0].outbounds.push({ id: subscribeID, tag: subscribeID, type: 'Subscription' })
  profile.outbounds[1].outbounds.push({ id: subscribeID, tag: subscribeID, type: 'Subscription' })

  await profilesStore.addProfile(profile)

  appSettingsStore.app.kernel.profile = profile.id

  message.success('home.initSuccessful')

  loading.value = false

  handleCancel()
}
</script>

<template>
  <div class="form-item">
    <div>{{ t('subscribe.url') }} *</div>
    <Input v-model="url" auto-size placeholder="http(s)://" autofocus style="width: 76%" />
  </div>

  <div class="form-action">
    <Button @click="handleCancel" :disabled="loading" type="text">{{ t('common.cancel') }}</Button>
    <Button @click="handleSubmit" :disabled="!canSubmit" :loading="loading" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>
