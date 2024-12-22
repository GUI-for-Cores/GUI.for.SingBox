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
  RulesTypeOptions
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
  fields.value.payload = ruleset.id
}

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const showLost = () => message.warn('kernel.route.rules.invalid')

const isSupportPayload = computed(() => {
  return ![RuleType.RuleSet].includes(fields.value.type as any)
})

const hasLost = (rule: IRule) => {
  if (rule.type === RuleType.Protocol) {
    return false
  }
  if (rule.type === RuleType.Inbound) {
    return !props.inboundOptions.find((v) => v.value === rule.payload)
  }
  if (rule.action !== RuleAction.Route) {
    return false
  }
  const outboundLost = !props.outboundOptions.find((v) => v.value === rule.outbound)
  if (rule.type === RuleType.RuleSet) {
    return !props.ruleSet.find((v) => v.id === rule.payload) || outboundLost
  }
  return outboundLost
}

const renderRule = (rule: IRule) => {
  const { type, payload, outbound, action } = rule
  const children: string[] = [type]
  if (type === RuleType.RuleSet) {
    const tag = props.ruleSet.find((v) => v.id === rule.payload)?.tag || rule.payload
    children.push(tag)
  } else if (type === RuleType.Inbound) {
    const tag = props.inboundOptions.find((v) => v.value === rule.payload)?.label || rule.payload
    children.push(tag)
  } else {
    children.push(payload)
  }
  children.push(action)
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
      <div class="ml-auto">
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
    <template v-if="fields.action === RuleAction.Route">
      <div class="form-item">
        {{ t('kernel.route.rules.outbound') }}
        <Select v-model="fields.outbound" :options="outboundOptions" />
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
            value: ClashMode.Global
          },
          {
            label: 'kernel.direct',
            value: ClashMode.Direct
          }
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
        @change="(val) => (fields.payload = val ? 'false' : 'true')"
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
            :selected="fields.payload === ruleset.id"
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
