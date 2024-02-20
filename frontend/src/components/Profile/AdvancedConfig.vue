<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { type ProfileType } from '@/stores'
import { DomainStrategyOptions, AdvancedConfigDefaults } from '@/constant'

const fields = defineModel<ProfileType['advancedConfig']>({ default: AdvancedConfigDefaults() })

const { t } = useI18n()

</script>

<template>
  <div class="form-item">
    {{ t('kernel.port') }}
    <Input v-model="fields.port" :min="0" :max="65535" type="number" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.socks-port') }}
    <Input v-model="fields['socks-port']" :min="0" :max="65535" type="number" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.external-controller') }}
    <Input v-model="fields['external-controller']" placeholder="127.0.0.1:9090" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.secret') }}
    <Input v-model="fields.secret" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.external-ui') }}
    <Input v-model="fields['external-ui']" placeholder="ui" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.external-ui-url') }}
    <Input v-model="fields['external-ui-url']" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.store-cache') }}
    <Switch v-model="fields.profile['store-cache']" />
  </div>
  <div class="form-item">
    {{ t('kernel.store-fake-ip') }}
    <Switch v-model="fields.profile['store-fake-ip']" />
  </div>
  <div class="form-item">
    {{ t('kernel.domain_strategy') }}
    <Select v-model="fields.domain_strategy" :options="DomainStrategyOptions" />
  </div>
  <div class="form-item">
    {{ t('kernel.tcp-fast-open') }}
    <Switch v-model="fields['tcp-fast-open']" />
  </div>
  <div class="form-item">
    {{ t('kernel.tcp-multi-path') }}
    <Switch v-model="fields['tcp-multi-path']" />
  </div>
  <div class="form-item">
    {{ t('kernel.udp-fragment') }}
    <Switch v-model="fields['udp-fragment']" />
  </div>
  <div class="form-item">
    {{ t('kernel.sniff') }}
    <Switch v-model="fields.sniff" />
  </div>
  <div class="form-item">
    {{ t('kernel.sniff-override-destination') }}
    <Switch v-model="fields['sniff-override-destination']" />
  </div>
</template>

<style lang="less" scoped>
.flex-start {
  align-items: flex-start;
}
</style>
