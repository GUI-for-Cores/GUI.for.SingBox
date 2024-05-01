<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { type ProfileType } from '@/stores'
import { StackOptions, TunConfigDefaults } from '@/constant'

const fields = defineModel<ProfileType['tunConfig']>({ default: TunConfigDefaults() })

const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.tun.enable') }}
    <Switch v-model="fields.enable" />
  </div>
  <template v-if="fields.enable">
    <div class="form-item">
      {{ t('kernel.tun.stack') }}
      <Radio v-model="fields.stack" :options="StackOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.auto-route') }}
      <Switch v-model="fields['auto-route']" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.interface_name') }}
      <Input v-model="fields['interface_name']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.mtu') }}
      <Input v-model="fields['mtu']" type="number" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.strict-route') }}
      <Switch v-model="fields['strict-route']" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.endpoint-independent-nat') }}
      <Switch v-model="fields['endpoint-independent-nat']" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.inet4-address') }}
      <Input v-model="fields['inet4-address']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.inet6-address') }}
      <Input v-model="fields['inet6-address']" editable />
    </div>
  </template>
</template>

<style lang="less" scoped>
.flex-start {
  align-items: flex-start;
}
</style>
