<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import RouteRulesConfig from './RouteRulesConfig.vue'
import RouteRulesetConfig from './RouteRulesetConfig.vue'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
}

defineProps<Props>()

const model = defineModel<IProfile['route']>({ required: true })

const activeKey = ref('common')
const rulesConfigRef = useTemplateRef('rulesConfigRef')
const rulesetConfigRef = useTemplateRef('rulesetConfigRef')
const tabs = [
  { key: 'common', tab: 'kernel.route.tab.common' },
  { key: 'rule_set', tab: 'kernel.route.tab.rule_set' },
  { key: 'rules', tab: 'kernel.route.tab.rules' },
]

const { t } = useI18n()

const handleAdd = () => {
  const handlerMap: Record<string, (() => void) | undefined> = {
    common: () => {},
    rules: rulesConfigRef.value?.handleAdd,
    rule_set: rulesetConfigRef.value?.handleAdd,
  }
  handlerMap[activeKey.value]?.()
}

defineExpose({ handleAdd })
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="tabs" tab-position="top">
    <template #common>
      <div class="form-item">
        {{ t('kernel.route.find_process') }}
        <Switch v-model="model.find_process" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.auto_detect_interface') }}
        <Switch v-model="model.auto_detect_interface" />
      </div>
      <div v-if="!model.auto_detect_interface" class="form-item">
        {{ t('kernel.route.default_interface') }}
        <InterfaceSelect v-model="model.default_interface" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.route.default_domain_resolver.server') }}
        <Select v-model="model.default_domain_resolver.server" :options="serverOptions" clearable />
      </div>
      <!-- <div class="form-item">
        {{ t('kernel.route.default_domain_resolver.client_subnet') }}
        <Input v-model="model.default_domain_resolver.client_subnet" editable />
      </div> -->
      <div class="form-item">
        {{ t('kernel.route.final') }}
        <Select v-model="model.final" :options="outboundOptions" clearable />
      </div>
    </template>
    <template #rule_set>
      <RouteRulesetConfig
        ref="rulesetConfigRef"
        v-model="model.rule_set"
        :outbound-options="outboundOptions"
      />
    </template>
    <template #rules>
      <RouteRulesConfig
        ref="rulesConfigRef"
        v-model="model.rules"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
        :rule-set="model.rule_set"
      />
    </template>
  </Tabs>
</template>
