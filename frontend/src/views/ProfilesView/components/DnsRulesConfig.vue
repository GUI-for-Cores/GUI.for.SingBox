<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone, isValidJson } from '@/utils'
import { useBool, useMessage } from '@/hooks'
import { DraggableOptions } from '@/constant/app'
import { DefaultDnsRule, DefaultDnsRules } from '@/constant/profile'
import {
  RuleType,
  ClashMode,
  RulesetType,
  RulesetFormat,
  RuleAction,
  RuleActionReject,
} from '@/enums/kernel'
import {
  DnsRuleTypeOptions,
  DnsRuleActionOptions,
  DnsRuleActionRejectOptions,
} from '@/constant/kernel'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  serversOptions: { label: string; value: string }[]
  ruleSet: IRuleSet[]
}

const props = defineProps<Props>()

const model = defineModel<IDNSRule[]>({ default: DefaultDnsRules() })

let ruleId = 0
const fields = ref<IDNSRule>(DefaultDnsRule())

const { t } = useI18n()
const [showEditModal] = useBool(false)
const { message } = useMessage()

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
  fields.value.payload = ruleset.id
}

const showLost = () => message.warn('kernel.route.rules.invalid')

const hasLost = (rule: IDNSRule) => {
  const checkServer = () => {
    if (rule.action === RuleAction.Route) {
      if (!props.serversOptions.find((v) => v.value === rule.server)) {
        return true
      }
      return false
    } else if (rule.action === RuleAction.RouteOptions) {
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
    if (rule.type === RuleType.Outbound) {
      return rule.payload !== 'any' && !props.outboundOptions.find((v) => v.value === rule.payload)
    }
    if (rule.type === RuleType.RuleSet) {
      return !props.ruleSet.find((v) => v.id === rule.payload)
    }
    if (rule.type === RuleType.Inline) {
      return !isValidJson(rule.payload)
    }
    return !rule.payload
  }

  return checkServer() || checkPayload()
}

const renderRule = (rule: IDNSRule) => {
  const { type, payload, server, action } = rule
  const children: string[] = [type]
  if (type === RuleType.RuleSet) {
    const tag = props.ruleSet.find((v) => v.id === rule.payload)?.tag || rule.payload
    children.push(tag)
  } else if (type === RuleType.Inline && payload.includes('__is_fake_ip')) {
    children.push('FakeIP')
  } else {
    children.push(payload)
  }
  children.push(action)
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
      <div class="ml-auto">
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
      <Select
        v-else-if="fields.type === RuleType.Outbound"
        v-model="fields.payload"
        :options="[{ label: 'any', value: 'any' }, ...outboundOptions]"
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
    <template v-if="fields.action === RuleAction.Route">
      <div class="form-item">
        {{ t('kernel.dns.rules.server') }}
        <Select v-model="fields.server" :options="serversOptions" />
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
