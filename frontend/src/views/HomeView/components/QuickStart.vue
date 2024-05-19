<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, inject, ref } from 'vue'

import { useMessage } from '@/hooks'
import * as Defaults from '@/constant'
import { sampleID, APP_TITLE, deepClone } from '@/utils'
import {
  useProfilesStore,
  useAppSettingsStore,
  useSubscribesStore,
  type SubscribeType,
  type ProfileType
} from '@/stores'

const { t } = useI18n()
const { message } = useMessage()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()

const url = ref('')
const loading = ref(false)
const useragent = ref(deepClone(appSettingsStore.app.userAgent || APP_TITLE))

const handleCancel = inject('cancel') as any

const canSubmit = computed(() => url.value && url.value.toLocaleLowerCase().startsWith('http'))

const handleSubmit = async () => {
  const profileID = sampleID()
  const subscribeID = sampleID()

  const profile: ProfileType = {
    id: profileID,
    name: profileID,
    generalConfig: Defaults.GeneralConfigDefaults(),
    advancedConfig: Defaults.AdvancedConfigDefaults(),
    tunConfig: Defaults.TunConfigDefaults(),
    dnsConfig: Defaults.DnsConfigDefaults(),
    proxyGroupsConfig: Defaults.ProxyGroupsConfigDefaults(),
    rulesConfig: Defaults.RulesConfigDefaults(),
    dnsRulesConfig: Defaults.DnsRulesConfigDefaults()
  }

  profile.proxyGroupsConfig[0].use = [subscribeID]
  profile.proxyGroupsConfig[1].use = [subscribeID]

  const subscribe: SubscribeType = {
    id: subscribeID,
    name: subscribeID,
    url: url.value,
    upload: 0,
    download: 0,
    total: 0,
    expire: '',
    updateTime: '',
    type: 'Http',
    website: '',
    path: `data/subscribes/${subscribeID}.json`,
    include: '',
    exclude: '',
    includeProtocol: '',
    excludeProtocol: Defaults.DefaultExcludeProtocols,
    proxyPrefix: '',
    disabled: false,
    inSecure: false,
    userAgent: '',
    proxies: []
  }

  loading.value = true

  try {
    await subscribeStore.addSubscribe(subscribe)

    await profilesStore.addProfile(profile)

    appSettingsStore.app.kernel.profile = profile.name
  } catch (error: any) {
    console.log(error)
    message.error(error)
    return
  }

  message.success('home.initSuccessful')

  try {
    await subscribeStore.updateSubscribe(subscribe.id)
  } catch (error: any) {
    console.log(error)
    message.warn(error, 10_000)
    message.warn('home.initFailed', 10_000)
  }

  loading.value = false

  handleCancel()
}
</script>

<template>
  <div class="form-item">
    <div>{{ t('subscribe.url') }} *</div>
    <Input v-model="url" auto-size placeholder="http(s)://" autofocus style="width: 76%" />
  </div>
  <div class="form-item">
    <div class="name">{{ t('subscribe.useragent') }}</div>
    <Input
      v-model="useragent"
      auto-size
      :placeholder="appSettingsStore.app.userAgent"
      style="width: 76%"
    />
  </div>

  <div class="form-action">
    <Button @click="handleCancel" :disabled="loading" type="text">{{ t('common.cancel') }}</Button>
    <Button @click="handleSubmit" :disabled="!canSubmit" :loading="loading" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped></style>
