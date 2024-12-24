<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, useTemplateRef } from 'vue'

import { sampleID } from '@/utils'
import { usePicker } from '@/hooks'
import { DomainStrategyOptions } from '@/constant/kernel'
import { RuleAction, RuleType, Strategy } from '@/enums/kernel'
import { DefaultDns, DefaultFakeIPDnsRule } from '@/constant/profile'

import DnsRulesConfig from './DnsRulesConfig.vue'
import DnsServersConfig from './DnsServersConfig.vue'
import type { PickerItem } from '@/components/Picker/index.vue'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  ruleSet: IRuleSet[]
}

defineProps<Props>()

const model = defineModel<IDNS>({
  default: DefaultDns(),
})

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
const { picker } = usePicker()

const handleAdd = () => {
  const handlerMap: Record<string, (() => void) | undefined> = {
    common: () => {},
    rules: rulesConfigRef.value?.handleAdd,
    servers: serversConfigRef.value?.handleAdd,
  }
  handlerMap[activeKey.value]?.()
}

const onFakeIPChange = async (enabled: boolean) => {
  if (!enabled) return

  const fakeip_server = model.value.servers.find((v) => v.address === 'fakeip')?.id
  const fakeip_rule = model.value.rules.find(
    (v) => v.type === RuleType.Inline && v.payload.includes('__is_fake_ip'),
  )

  if (fakeip_server && fakeip_rule) return

  const initialValue = [...(!fakeip_server ? ['0'] : []), ...(!fakeip_rule ? ['1'] : [])]

  const options: PickerItem[] = [
    ...(!fakeip_server ? [{ label: 'kernel.dns.fakeip.addServer', value: '0' }] : []),
    ...(!fakeip_rule ? [{ label: 'kernel.dns.fakeip.addRules', value: '1' }] : []),
  ]

  const actions = await picker
    .multi<string[]>('Tip', options, initialValue)
    .catch(() => [] as string[])

  const _fakeip_server = fakeip_server || sampleID()
  if (actions.includes('0')) {
    model.value.servers.push({
      id: _fakeip_server,
      tag: 'FakeIP-DNS',
      address: 'fakeip',
      address_resolver: '',
      detour: '',
      strategy: Strategy.Default,
      client_subnet: '',
    })
    if (fakeip_rule) {
      fakeip_rule.server = _fakeip_server
    }
  }
  if (actions.includes('1')) {
    const fakeip_rule: IDNSRule = {
      id: sampleID(),
      type: RuleType.Inline,
      payload: JSON.stringify(DefaultFakeIPDnsRule(), null, 2),
      action: RuleAction.Route,
      server: _fakeip_server,
    }
    const idx = model.value.rules.findIndex((v) => v.payload === 'any')
    model.value.rules.splice(idx + 1, 0, fakeip_rule)
  }
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
        <Switch v-model="model.fakeip.enabled" @change="onFakeIPChange" />
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
