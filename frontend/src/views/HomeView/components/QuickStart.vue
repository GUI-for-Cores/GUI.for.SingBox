<script setup lang="ts">
import { h, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DefaultSubscribeScript } from '@/constant/app'
import { DefaultExcludeProtocols } from '@/constant/kernel'
import * as Defaults from '@/constant/profile'
import { RequestMethod } from '@/enums/app'
import { useProfilesStore, useAppSettingsStore, useSubscribesStore } from '@/stores'
import { message, sampleID } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { Subscription } from '@/types/app'

const { t } = useI18n()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()

const url = ref('')
const name = ref('')
const loading = ref(false)

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  const subscribeID = sampleID()

  if (!name.value) {
    name.value = sampleID()
  }

  const subscribe: Subscription = {
    id: subscribeID,
    name: name.value,
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
    requestMethod: RequestMethod.Get,
    header: {
      request: {},
      response: {},
    },
    proxies: [],
    script: DefaultSubscribeScript,
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
    name: name.value,
    log: Defaults.DefaultLog(),
    experimental: Defaults.DefaultExperimental(),
    inbounds: Defaults.DefaultInbounds(),
    outbounds: Defaults.DefaultOutbounds(),
    route: Defaults.DefaultRoute(),
    dns: Defaults.DefaultDns(),
    mixin: Defaults.DefaultMixin(),
    script: Defaults.DefaultScript(),
  }

  if (profile.outbounds[0] && profile.outbounds[1]) {
    profile.outbounds[0].outbounds.push({ id: subscribeID, tag: subscribeID, type: 'Subscription' })
    profile.outbounds[1].outbounds.push({ id: subscribeID, tag: subscribeID, type: 'Subscription' })
  }

  await profilesStore.addProfile(profile)

  appSettingsStore.app.kernel.profile = profile.id

  message.success('home.initSuccessful')

  loading.value = false

  handleSubmit()
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
        disabled: !/^https?:\/\//.test(url.value),
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div class="flex gap-4">
    <Input v-model="name" :placeholder="$t('profile.name')" auto-size clearable class="w-[25%]" />
    <Input v-model="url" placeholder="http(s)://" autofocus clearable class="w-[75%]" />
  </div>
</template>
