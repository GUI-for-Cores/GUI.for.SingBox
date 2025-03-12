<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils'
import { useBool, useMessage } from '@/hooks'
import { DraggableOptions } from '@/constant/app'
import { DefaultRouteRule } from '@/constant/profile'
import { RuleAction, RulesetFormat, RulesetType, RuleType, ClashMode } from '@/enums/kernel'
import {
  DomainStrategyOptions,
  RuleActionOptions,
  RuleSnifferOptions,
  RulesTypeOptions,
} from '@/constant/kernel'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
  ruleSet: IRuleSet[]
}

const props = defineProps<Props>()

const model = defineModel<IRule[]>({ default: DefaultRouteRule() })

let ruleId = 0
const fields = ref<IRule>(DefaultRouteRule())

const { t } = useI18n()
const [showEditModal] = useBool(false)
const { message } = useMessage()

const handleAdd = () => {
  ruleId = -1
  fields.value = DefaultRouteRule()
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (ruleId !== -1) {
    model.value[ruleId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
}

const handleEdit = (index: number) => {
  ruleId = index
  fields.value = deepClone(model.value[index])
  showEditModal.value = true
}

const handleUse = (ruleset: any) => {
  const ids = fields.value.payload.split(',').filter((v) => v)
  const idx = ids.findIndex((v) => v === ruleset.id)
  if (idx === -1) {
    ids.push(ruleset.id)
  } else {
    ids.splice(idx, 1)
  }
  fields.value.payload = ids.join(',')
}

const handleClearRuleset = (ruleset: any) => {
  const ids = fields.value.payload.split(',').filter((id) => props.ruleSet.find((v) => v.id === id))
  ruleset.payload = ids.join(',')
}

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const showLost = () => message.warn('kernel.route.rules.invalid')

const isSupportPayload = computed(() => {
  return ![RuleType.RuleSet].includes(fields.value.type as any)
})

const hasLost = (rule: IRule) => {
  const rulesValidationFlags: boolean[] = []
  const hasMissingInbound = !props.inboundOptions.find((v) => v.value === rule.payload)
  const hasMissingOutbound = !props.outboundOptions.find((v) => v.value === rule.outbound)
  const hasMissingRuleset = rule.payload
    .split(',')
    .some((id) => !props.ruleSet.find((v) => v.id === id))
  if (rule.action === RuleAction.Route) {
    rulesValidationFlags.push(hasMissingOutbound)
  } else if (rule.action === RuleAction.RouteOptions) {
    let isValid = true
    try {
      JSON.parse(rule.outbound)
    } catch {
      isValid = false
    }
    rulesValidationFlags.push(!isValid)
  }
  if (rule.type === RuleType.Inbound) {
    rulesValidationFlags.push(hasMissingInbound)
  } else if (rule.type === RuleType.IpIsPrivate) {
    rulesValidationFlags.push(!['true', 'false'].includes(rule.payload))
  } else if (rule.type === RuleType.RuleSet) {
    rulesValidationFlags.push(hasMissingRuleset)
  }
  return rulesValidationFlags.some((v) => v) || !rule.payload
}

const renderRule = (rule: IRule) => {
  const { type, payload, outbound, action, invert } = rule
  const children: string[] = [type]
  let _payload = payload
  if (type === RuleType.RuleSet) {
    _payload = rule.payload
      .split(',')
      .map((id) => props.ruleSet.find((v) => v.id === id)?.tag || id)
      .join(',')
  } else if (type === RuleType.Inbound) {
    _payload = props.inboundOptions.find((v) => v.value === rule.payload)?.label || rule.payload
  }
  if (invert) {
    _payload += ` (invert) `
  }
  children.push(_payload, action)
  if (outbound) {
    const proxy = props.outboundOptions.find((v) => v.value === outbound)?.label || outbound
    children.push(proxy)
  }
  return children.join(',')
}
</script>

<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <Button @click="handleAdd" icon="add" type="primary" size="small">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(rule, index) in model" :key="rule.id" class="rule-item">
      <div class="font-bold">
        <span v-if="hasLost(rule)" @click="showLost" class="warn"> [ ! ] </span>
        {{ renderRule(rule) }}
      </div>
      <div class="flex text-nowrap ml-auto">
        <Button
          v-if="rule.type === RuleType.RuleSet && rule.payload && hasLost(rule)"
          @click="handleClearRuleset(rule)"
          type="text"
        >
          {{ t('common.clear') }}
        </Button>
        <Button @click="handleEdit(index)" icon="edit" type="text" size="small" />
        <Button @click="handleDelete(index)" icon="delete" type="text" size="small" />
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    @ok="handleAddEnd"
    title="kernel.route.tab.rules"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.route.rules.type') }}
      <Select v-model="fields.type" :options="RulesTypeOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rules.action.name') }}
      <Radio v-model="fields.action" :options="RuleActionOptions" class="ml-8" />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rules.invert') }}
      <Switch v-model="fields.invert" />
    </div>
    <template v-if="fields.action === RuleAction.Route">
      <div class="form-item">
        {{ t('kernel.route.rules.outbound') }}
        <Select v-model="fields.outbound" :options="outboundOptions" clearable />
      </div>
    </template>
    <template v-else-if="fields.action === RuleAction.RouteOptions">
      <div class="form-item">
        {{ t('kernel.route.rules.routeOptions') }}
        <CodeViewer v-model="fields.outbound" editable lang="json" style="min-width: 320px" />
      </div>
    </template>
    <template v-else-if="fields.action === RuleAction.Sniff">
      <div class="form-item">
        {{ t('kernel.route.rules.sniffer.name') }}
        <div class="flex items-center">
          <Switch :model-value="fields.sniffer.length === 0" disabled>All</Switch>
          <CheckBox v-model="fields.sniffer" :options="RuleSnifferOptions" class="ml-4" />
        </div>
      </div>
    </template>
    <template v-else-if="fields.action === RuleAction.Resolve">
      <div class="form-item">
        {{ t('kernel.strategy.name') }}
        <Select v-model="fields.strategy" :options="DomainStrategyOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rules.server') }}
        <Select
          v-model="fields.server"
          :options="[{ label: 'kernel.strategy.byDnsRules', value: '' }, ...serverOptions]"
        />
      </div>
    </template>
    <div v-if="isSupportPayload" class="form-item">
      {{ t('kernel.route.rules.payload') }}
      <Radio
        v-if="fields.type === RuleType.ClashMode"
        v-model="fields.payload"
        :options="[
          {
            label: 'kernel.global',
            value: ClashMode.Global,
          },
          {
            label: 'kernel.direct',
            value: ClashMode.Direct,
          },
        ]"
      />
      <Select
        v-else-if="fields.type === RuleType.Inbound"
        v-model="fields.payload"
        :options="inboundOptions"
      />
      <CodeViewer
        v-else-if="fields.type === RuleType.Inline"
        v-model="fields.payload"
        editable
        lang="json"
        style="min-width: 320px"
      />
      <Switch
        v-else-if="fields.type === RuleType.IpIsPrivate"
        :model-value="fields.payload === 'true'"
        @change="(val: boolean) => (fields.payload = val ? 'false' : 'true')"
      />
      <Input v-else v-model="fields.payload" autofocus />
    </div>

    <template v-if="fields.type === RuleType.RuleSet">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <div class="rulesets">
        <Empty v-if="ruleSet.length === 0" :description="t('kernel.route.rule_set.empty')" />
        <template v-else>
          <Card
            v-for="ruleset in ruleSet"
            :key="ruleset.tag"
            :title="ruleset.tag"
            @click="handleUse(ruleset)"
            :selected="fields.payload.includes(ruleset.id)"
            v-tips="ruleset.type"
            class="ruleset"
          >
            {{ ruleset.type }}
            {{ ruleset.type === RulesetType.Inline ? RulesetFormat.Source : ruleset.format }}
          </Card>
        </template>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.rule-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 2px;
  .warn {
    color: rgb(200, 193, 11);
    cursor: pointer;
  }
}

.rulesets {
  display: flex;
  flex-wrap: wrap;
  .ruleset {
    width: calc(33.3333% - 16px);
    margin: 8px;
    font-size: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
