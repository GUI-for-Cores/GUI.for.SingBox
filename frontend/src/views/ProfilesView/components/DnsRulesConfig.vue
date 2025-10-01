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
    <Card v-for="(rule, index) in model" :key="rule.id" class="mb-2">
      <div class="flex items-center py-2">
        <div class="font-bold">
          <span v-if="hasLost(rule)" @click="showLost" class="warn cursor-pointer"> [ ! ] </span>
          {{ renderRule(rule) }}
        </div>
        <div class="ml-auto">
          <Button
            v-if="rule.type === RuleType.RuleSet && rule.payload && hasLost(rule)"
            @click="handleClearRuleset(rule)"
            size="small"
            type="text"
          >
            {{ t('common.clear') }}
          </Button>
          <Button @click="handleEdit(index)" icon="edit" type="text" size="small" />
          <Button @click="handleDeleteRule(index)" icon="delete" type="text" size="small" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
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
        @change="(val) => (fields.payload = val ? 'true' : 'false')"
      />
      <Input v-else v-model="fields.payload" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rules.invert') }}
      <Switch v-model="fields.invert" />
    </div>
    <Card class="mt-4 mb-16">
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
      <template v-else-if="fields.action === RuleAction.RouteOptions">
        <div class="form-item">
          {{ t('kernel.route.rules.routeOptions') }}
          <CodeViewer v-model="fields.server" editable lang="json" style="min-width: 320px" />
        </div>
      </template>
      <template v-else-if="fields.action === RuleAction.Reject">
        <div class="form-item">
          {{ t('kernel.route.rules.action.rejectMethod') }}
          <Radio v-model="fields.server" :options="DnsRuleActionRejectOptions" />
        </div>
      </template>
      <template v-else-if="fields.action === RuleAction.Predefined">
        <div class="form-item">
          {{ t('kernel.route.rules.action.predefined') }}
          <CodeViewer v-model="fields.server" editable lang="json" style="min-width: 320px" />
        </div>
      </template>
      <template v-if="[RuleAction.Route, RuleAction.RouteOptions].includes(fields.action as any)">
        <div class="form-item">
          {{ t('kernel.route.rules.disable_cache') }}
          <Switch v-model="fields.disable_cache" />
        </div>
        <div class="form-item">
          {{ t('kernel.route.rules.client_subnet') }}
          <Input v-model="fields.client_subnet" editable />
        </div>
      </template>
    </Card>
    <template v-if="fields.type === RuleType.RuleSet">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <Empty v-if="ruleSet.length === 0" :description="t('kernel.route.rule_set.empty')" />
      <div class="grid grid-cols-3 gap-8">
        <Card
          v-for="ruleset in ruleSet"
          :key="ruleset.tag"
          :title="ruleset.tag"
          @click="handleUse(ruleset)"
          :selected="fields.payload.includes(ruleset.id)"
          v-tips="ruleset.type"
          class="text-12 line-clamp-1"
        >
          {{ ruleset.type }}
          {{ ruleset.type === RulesetType.Inline ? RulesetFormat.Source : ruleset.format }}
        </Card>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.warn {
  color: rgb(200, 193, 11);
}
</style>
