<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, useTemplateRef } from 'vue'

import { DefaultDns } from '@/constant/profile'
import { DomainStrategyOptions } from '@/constant/kernel'

import DnsRulesConfig from './DnsRulesConfig.vue'
import DnsServersConfig from './DnsServersConfig.vue'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  ruleSet: IRuleSet[]
}

defineProps<Props>()

const model = defineModel<IDNS>({
  default: DefaultDns()
})

const serversOptions = computed(() =>
  model.value.servers.map((v) => ({ label: v.tag, value: v.id }))
)

const activeKey = ref('common')
const rulesConfigRef = useTemplateRef('rulesConfigRef')
const serversConfigRef = useTemplateRef('serversConfigRef')
const tabs = [
  { key: 'common', tab: 'kernel.dns.tab.common' },
  { key: 'servers', tab: 'kernel.dns.tab.servers' },
  { key: 'rules', tab: 'kernel.dns.tab.rules' }
]

const { t } = useI18n()

const handleAdd = () => {
  const handlerMap: Record<string, (() => void) | undefined> = {
    common: () => {},
    rules: rulesConfigRef.value?.handleAdd,
    servers: serversConfigRef.value?.handleAdd
  }
  handlerMap[activeKey.value]?.()
}

defineExpose({ handleAdd })
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="tabs" tab-position="top">
    <template #common>
      <div class="form-item">
        {{ t('kernel.dns.disable_cache') }}
        <Switch v-model="model.disable_cache" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.disable_expire') }}
        <Switch v-model="model.disable_expire" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.independent_cache') }}
        <Switch v-model="model.independent_cache" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.final') }}
        <Select v-model="model.final" :options="serversOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.strategy') }}
        <Select v-model="model.strategy" :options="DomainStrategyOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.client_subnet') }}
        <Input v-model="model.client_subnet" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.fakeip.name') }}
        <Switch v-model="model.fakeip.enabled" />
      </div>
      <template v-if="model.fakeip.enabled">
        <div class="form-item">
          {{ t('kernel.dns.fakeip.inet4_range') }}
          <Input v-model="model.fakeip.inet4_range" editable />
        </div>
        <div class="form-item">
          {{ t('kernel.dns.fakeip.inet6_range') }}
          <Input v-model="model.fakeip.inet6_range" editable />
        </div>
      </template>
    </template>
    <template #servers>
      <DnsServersConfig
        v-model="model.servers"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
        ref="serversConfigRef"
      />
    </template>
    <template #rules>
      <DnsRulesConfig
        v-model="model.rules"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
        :rule-set="ruleSet"
        ref="rulesConfigRef"
      />
    </template>
  </Tabs>
</template>
