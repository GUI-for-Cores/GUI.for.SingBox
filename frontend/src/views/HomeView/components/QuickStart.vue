<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, inject, ref } from 'vue'

import { useMessage } from '@/hooks'
import * as Defaults from '@/constant'
import { sampleID } from '@/utils'
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

const handleCancel = inject('cancel') as any

const canSubmit = computed(() => url.value && url.value.toLocaleLowerCase().startsWith('http'))

const handleSubmit = async () => {
  const profileID = sampleID()
  const subscribeID = sampleID()

  const ids = [sampleID(), sampleID(), sampleID(), sampleID(), sampleID(), sampleID()]

  const profile: ProfileType = {
    id: profileID,
    name: profileID,
    generalConfig: Defaults.GeneralConfigDefaults(),
    advancedConfig: Defaults.AdvancedConfigDefaults(),
    tunConfig: Defaults.TunConfigDefaults(),
    dnsConfig: Defaults.DnsConfigDefaults(ids),
    proxyGroupsConfig: Defaults.ProxyGroupsConfigDefaults(ids),
    rulesConfig: Defaults.RulesConfigDefaults(ids),
    dnsRulesConfig: Defaults.DnsRulesConfigDefaults(ids),
    mixinConfig: Defaults.MixinConfigDefaults(),
    scriptConfig: Defaults.ScriptConfigDefaults()
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
    expire: 0,
    updateTime: 0,
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

  <div class="form-action">
    <Button @click="handleCancel" :disabled="loading" type="text">{{ t('common.cancel') }}</Button>
    <Button @click="handleSubmit" :disabled="!canSubmit" :loading="loading" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped></style>
