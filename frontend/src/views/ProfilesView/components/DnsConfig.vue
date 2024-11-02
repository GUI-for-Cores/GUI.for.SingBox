<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { type ProfileType } from '@/stores'
import { DomainStrategyOptions, FinalDnsOptions, DnsConfigDefaults } from '@/constant'

interface Props {
  proxyGroups: ProfileType['proxyGroupsConfig']
}

const fields = defineModel<ProfileType['dnsConfig']>({
  default: DnsConfigDefaults(['1', '2', '3'])
})
const props = defineProps<Props>()

const { t } = useI18n()

const proxyOptions = computed(() => [
  ...props.proxyGroups.map(({ id, tag }) => ({ label: tag, value: id })),
  { label: 'direct', value: 'direct' },
  { label: 'block', value: 'block' },
  { label: t('kernel.dns.default'), value: '' }
])
</script>

<template>
  <div class="form-item">
    {{ t('kernel.dns.enable') }}
    <Switch v-model="fields.enable" />
  </div>
  <template v-if="fields.enable">
    <div class="form-item">
      {{ t('kernel.dns.local-dns') }}
      <Input v-model="fields['local-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.remote-dns') }}
      <Input v-model="fields['remote-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.resolver-dns') }}
      <Input v-model="fields['resolver-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.remote-resolver-dns') }}
      <Input v-model="fields['remote-resolver-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.final-dns') }}
      <Select v-model="fields['final-dns']" :options="FinalDnsOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.local-dns-detour') }}
      <Select v-model="fields['local-dns-detour']" :options="proxyOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.remote-dns-detour') }}
      <Select v-model="fields['remote-dns-detour']" :options="proxyOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.strategy.name') }}
      <Select v-model="fields['strategy']" :options="DomainStrategyOptions" />
    </div>

    <div class="form-item">
      {{ t('kernel.dns.disable-cache') }}
      <Switch v-model="fields['disable-cache']" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.disable-expire') }}
      <Switch v-model="fields['disable-expire']" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.independent-cache') }}
      <Switch v-model="fields['independent-cache']" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.client-subnet') }}
      <Input v-model="fields['client-subnet']" editable />
    </div>

    <div class="form-item">
      Fake-IP
      <Switch v-model="fields['fakeip']" />
    </div>
    <div v-if="fields['fakeip']">
      <div class="form-item">
        {{ t('kernel.dns.fake-ip-range-v4') }}
        <Input v-model="fields['fake-ip-range-v4']" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.fake-ip-range-v6') }}
        <Input v-model="fields['fake-ip-range-v6']" editable />
      </div>
      <div class="form-item" :class="{ 'flex-start': fields['fake-ip-filter'].length !== 0 }">
        {{ t('kernel.dns.fake-ip-filter') }}
        <InputList v-model="fields['fake-ip-filter']" />
      </div>
    </div>
  </template>
</template>

<style lang="less" scoped>
.flex-start {
  align-items: flex-start;
}
</style>
