<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import {
  DnsRuleTypeOptions,
  DnsRuleActionOptions,
  DnsRuleActionRejectOptions,
  DomainStrategyOptions,
} from '@/constant/kernel'
import { DefaultDnsRule } from '@/constant/profile'
import {
  RuleType,
  ClashMode,
  RulesetType,
  RulesetFormat,
  RuleAction,
  RuleActionReject,
} from '@/enums/kernel'
import { useBool } from '@/hooks'
import { deepClone, isValidJson, message } from '@/utils'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  serversOptions: { label: string; value: string }[]
  ruleSet: IRuleSet[]
}

const props = defineProps<Props>()

const model = defineModel<IDNSRule[]>({ required: true })

let ruleId = 0
const fields = ref<IDNSRule>(DefaultDnsRule())

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  ruleId = -1
  fields.value = DefaultDnsRule()
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

const handleDeleteRule = (index: number) => {
  model.value.splice(index, 1)
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

const showLost = () => message.warn('kernel.route.rules.invalid')

const hasLost = (rule: IDNSRule) => {
  const checkServer = () => {
    if (rule.action === RuleAction.Route) {
      if (!props.serversOptions.find((v) => v.value === rule.server)) {
        return true
      }
      return false
    } else if ([RuleAction.RouteOptions, RuleAction.Predefined].includes(rule.action as any)) {
      return !isValidJson(rule.server)
    } else if (rule.action === RuleAction.Reject) {
      return ![RuleActionReject.Default, RuleActionReject.Drop].includes(rule.server as any)
    }
    return false
  }

  const checkPayload = () => {
    if (rule.type === RuleType.Inbound) {
      return !props.inboundOptions.find((v) => v.value === rule.payload)
    }
    if (rule.type === RuleType.RuleSet) {
      const hasMissingRuleset = rule.payload
        .split(',')
        .some((id) => !props.ruleSet.find((v) => v.id === id))
      return hasMissingRuleset
    }
    if (rule.type === RuleType.Inline) {
      return !isValidJson(rule.payload)
    }
    return !rule.payload
  }

  return checkServer() || checkPayload()
}

const renderRule = (rule: IDNSRule) => {
  const { type, payload, server, action, invert } = rule
  const children: string[] = [type]
  let _payload = payload
  if (type === RuleType.RuleSet) {
    _payload = rule.payload
      .split(',')
      .map((id) => props.ruleSet.find((v) => v.id === id)?.tag || id)
      .join(',')
  } else if (type === RuleType.Inline && payload.includes('__is_fake_ip')) {
    _payload = 'FakeIP'
  }
  if (invert) {
    _payload += ` (invert) `
  }
  children.push(_payload, action)
  if (server) {
    const proxy = props.serversOptions.find((v) => v.value === server)?.label || server
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
        <Button @click="handleDeleteRule(index)" icon="delete" type="text" size="small" />
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    @ok="handleAddEnd"
    title="kernel.dns.tab.rules"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.dns.rules.type') }}
      <Select v-model="fields.type" :options="DnsRuleTypeOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.rules.action') }}
      <Radio v-model="fields.action" :options="DnsRuleActionOptions" />
    </div>
    <div v-if="fields.type !== RuleType.RuleSet" class="form-item">
      {{ t('kernel.dns.rules.payload') }}
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
        v-else-if="[RuleType.IpIsPrivate, RuleType.IpAcceptAny].includes(fields.type as any)"
        :model-value="fields.payload === 'true'"
        @change="(val) => (fields.payload = val ? 'false' : 'true')"
      />
      <Input v-else v-model="fields.payload" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rules.invert') }}
      <Switch v-model="fields.invert" />
    </div>
    <Card
      v-if="[RuleAction.Route, RuleAction.RouteOptions].includes(fields.action as any)"
      class="pt-4 mt-4"
    >
      <template v-if="fields.action === RuleAction.Route">
        <div class="form-item">
          {{ t('kernel.dns.rules.server') }}
          <Select v-model="fields.server" :options="serversOptions" />
        </div>
        <div class="form-item">
          {{ t('kernel.route.rules.strategy') }}
          <Select v-model="fields.strategy" :options="DomainStrategyOptions" />
        </div>
      </template>
      <div v-else-if="fields.action === RuleAction.RouteOptions" class="form-item">
        {{ t('kernel.route.rules.routeOptions') }}
        <CodeViewer v-model="fields.server" editable lang="json" style="min-width: 320px" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rules.disable_cache') }}
        <Switch v-model="fields.disable_cache" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rules.client_subnet') }}
        <Input v-model="fields.client_subnet" editable />
      </div>
    </Card>
    <Card v-else-if="fields.action === RuleAction.Reject" class="pt-4 mt-4">
      <div class="form-item">
        {{ t('kernel.route.rules.action.rejectMethod') }}
        <Radio v-model="fields.server" :options="DnsRuleActionRejectOptions" />
      </div>
    </Card>
    <Card v-else-if="fields.action === RuleAction.Predefined" class="pt-4 mt-4">
      <div class="form-item">
        {{ t('kernel.route.rules.action.predefined') }}
        <CodeViewer v-model="fields.server" editable lang="json" style="min-width: 320px" />
      </div>
    </Card>
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
