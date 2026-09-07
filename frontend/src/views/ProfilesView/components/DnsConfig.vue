<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { DomainStrategyOptions } from '@/constant/kernel'

import DnsRulesConfig from './DnsRulesConfig.vue'
import DnsServersConfig from './DnsServersConfig.vue'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  ruleSet: App.ProfileRuleSet[]
}

defineProps<Props>()

const model = defineModel<App.Dns>({ required: true })

const serversOptions = computed(() =>
  model.value.servers.map((v) => ({ label: v.tag, value: v.id })),
)

const activeKey = ref('common')
const rulesConfigRef = useTemplateRef('rulesConfigRef')
const serversConfigRef = useTemplateRef('serversConfigRef')
const tabs = [
  { key: 'common', tab: 'kernel.dns.tab.common' },
  { key: 'servers', tab: 'kernel.dns.tab.servers' },
  { key: 'rules', tab: 'kernel.dns.tab.rules' },
]

const { t } = useI18n()

const handleAdd = () => {
  const handlerMap: Record<string, (() => void) | undefined> = {
    common: () => {},
    rules: rulesConfigRef.value?.handleAdd,
    servers: serversConfigRef.value?.handleAdd,
  }
  handlerMap[activeKey.value]?.()
}

const onDisableCacheChange = (v: boolean) => {
  if (v) {
    model.value.optimistic.enabled = false
  }
}
const onDisableExpireChange = (v: boolean) => {
  if (v) {
    model.value.optimistic.enabled = false
  }
}
const onOptimisticEnabledChange = (v: boolean) => {
  if (v) {
    model.value.disable_cache = false
    model.value.disable_expire = false
  }
}

defineExpose({ handleAdd })
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="tabs" tab-position="top">
    <template #common>
      <div class="form-item">
        {{ t('kernel.dns.disable_cache') }}
        <Switch v-model="model.disable_cache" @change="onDisableCacheChange" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.disable_expire') }}
        <Switch v-model="model.disable_expire" @change="onDisableExpireChange" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.optimistic.name') }}
        <Switch v-model="model.optimistic.enabled" @change="onOptimisticEnabledChange" />
      </div>
      <div v-if="model.optimistic.enabled" class="form-item">
        {{ t('kernel.dns.optimistic.timeout') }}
        <Input v-model="model.optimistic.timeout" editable />
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
    </template>
    <template #servers>
      <DnsServersConfig
        ref="serversConfigRef"
        v-model="model.servers"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
      />
    </template>
    <template #rules>
      <DnsRulesConfig
        ref="rulesConfigRef"
        v-model="model.rules"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
        :rule-set="ruleSet"
      />
    </template>
  </Tabs>
</template>
