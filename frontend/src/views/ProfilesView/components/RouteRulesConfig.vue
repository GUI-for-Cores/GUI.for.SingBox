<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { RuleActionRejectOptions } from '@/constant/kernel'
import {
  DomainStrategyOptions,
  RuleActionOptions,
  RuleSnifferOptions,
  RulesTypeOptions,
} from '@/constant/kernel'
import { DefaultRouteRule } from '@/constant/profile'
import {
  RuleAction,
  RulesetFormat,
  RulesetType,
  RuleType,
  ClashMode,
  Strategy,
} from '@/enums/kernel'
import { useBool } from '@/hooks'
import { deepClone, message } from '@/utils'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
  ruleSet: IRuleSet[]
}

const props = defineProps<Props>()

const model = defineModel<IRule[]>({ required: true })

let ruleId = 0
const fields = ref<IRule>(DefaultRouteRule())

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  ruleId = -1
  fields.value = DefaultRouteRule()
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddInsertionPoint = () => {
  model.value.unshift({
    id: RuleType.InsertionPoint,
    type: RuleType.InsertionPoint,
    enable: true,
    payload: '',
    invert: false,
    action: RuleAction.Sniff,
    outbound: '',
    sniffer: [],
    strategy: Strategy.Default,
    server: '',
  })
}

const handleAddEnd = () => {
  if (ruleId !== -1) {
    model.value[ruleId] = fields.value
  } else {
    const index = model.value.findIndex((v) => v.type === RuleType.InsertionPoint)
    if (index !== -1) {
      model.value.splice(index + 1, 0, fields.value)
    } else {
      model.value.unshift(fields.value)
    }
  }
}

const handleEdit = (index: number) => {
  ruleId = index
  fields.value = deepClone(model.value[index]!)
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

const isInsertionPointMissing = computed(
  () => model.value.findIndex((rule) => rule.type === RuleType.InsertionPoint) === -1,
)

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
  <Empty v-if="model.length === 0 || (model.length === 1 && !isInsertionPointMissing)">
    <template #description>
      <Button icon="add" type="primary" size="small" @click="handleAdd">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <Divider v-if="isInsertionPointMissing">
    <Button type="text" size="small" @click="handleAddInsertionPoint">
      {{ t('kernel.addInsertionPoint') }}
    </Button>
  </Divider>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(rule, index) in model" :key="rule.id" class="mb-2">
      <div v-if="rule.type === RuleType.InsertionPoint" class="text-center font-bold">
        <Divider class="cursor-move">
          <Button icon="add" type="text" size="small" @click="handleAdd">
            {{ t('kernel.insertionPoint') }}
          </Button>
        </Divider>
      </div>
      <div v-else class="flex items-center py-2 gap-8">
        <Switch v-model="rule.enable" border="square" size="small" />
        <div class="font-bold">
          <span
            v-if="hasLost(rule)"
            class="cursor-pointer"
            :style="{ color: 'rgb(200, 193, 11)' }"
            @click="showLost"
          >
            [ ! ]
          </span>
          {{ renderRule(rule) }}
        </div>
        <div class="ml-auto">
          <Button
            v-if="rule.type === RuleType.RuleSet && rule.payload && hasLost(rule)"
            type="text"
            @click="handleClearRuleset(rule)"
          >
            {{ t('common.clear') }}
          </Button>
          <Button icon="edit" type="text" size="small" @click="handleEdit(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDelete(index)" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
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
      <template v-else-if="fields.action === RuleAction.Reject">
        <div class="form-item">
          {{ t('kernel.route.rules.action.rejectMethod') }}
          <Radio v-model="fields.outbound" :options="RuleActionRejectOptions" />
        </div>
      </template>
      <template v-else-if="fields.action === RuleAction.HijackDNS">
        <Empty description="common.none" />
      </template>
      <template v-else-if="fields.action === RuleAction.Sniff">
        <div class="form-item">
          <div>
            {{ t('kernel.route.rules.sniffer.name') }}
            <Switch :model-value="fields.sniffer.length === 0" disabled>All</Switch>
          </div>
          <div class="flex flex-col gap-4 items-end">
            <CheckBox
              v-model="fields.sniffer"
              :options="RuleSnifferOptions.slice(0, 5)"
              class="ml-4"
            />
            <CheckBox
              v-model="fields.sniffer"
              :options="RuleSnifferOptions.slice(5)"
              class="ml-4"
            />
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
    </Card>
    <template v-if="fields.type === RuleType.RuleSet">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <div class="grid grid-cols-3 gap-8">
        <Empty v-if="ruleSet.length === 0" :description="t('kernel.route.rule_set.empty')" />
        <template v-else>
          <Card
            v-for="ruleset in ruleSet"
            :key="ruleset.tag"
            v-tips="ruleset.type"
            :title="ruleset.tag"
            :selected="fields.payload.includes(ruleset.id)"
            class="ruleset"
            @click="handleUse(ruleset)"
          >
            <div class="text-12">
              {{ ruleset.type }}
              {{ ruleset.type === RulesetType.Inline ? RulesetFormat.Source : ruleset.format }}
            </div>
          </Card>
        </template>
      </div>
    </template>
  </Modal>
</template>
