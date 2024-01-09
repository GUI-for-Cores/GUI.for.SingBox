<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'

import { useMessage } from '@/hooks'
import { deepClone, sampleID, isValidInlineRuleJson } from '@/utils'
import { type ProfileType, useRulesetsStore, type RuleSetType } from '@/stores'
import { DnsRulesTypeOptions, DraggableOptions, RulesetFormatOptions } from '@/constant'

interface Props {
  modelValue: ProfileType['dnsRulesConfig']
  dnsConfig: ProfileType['dnsConfig']
  proxyGroups: ProfileType['proxyGroupsConfig']
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emits = defineEmits(['update:modelValue'])

let updateRuleId = 0
const showModal = ref(false)
const rules = ref(deepClone(props.modelValue))

const fields = ref({
  id: sampleID(),
  type: 'rule_set',
  payload: '',
  server: '',
  invert: false,
  'disable-cache': false,
  'ruleset-name': '',
  'ruleset-format': 'binary',
  'download-detour': ''
})

const dnsOptions = computed(() => [
  { label: t('kernel.dns.local-dns'), value: 'local-dns' },
  { label: t('kernel.dns.remote-dns'), value: 'remote-dns' },
  { label: t('kernel.dns.resolver-dns'), value: 'resolver-dns' },
  { label: t('kernel.dns.remote-resolver-dns'), value: 'remote-resolver-dns' },
  ...(props.dnsConfig.fakeip ? [{ label: t('kernel.dns.fakeip-dns'), value: 'fakeip-dns' }] : []),
  { label: t('kernel.dns.block'), value: 'block' }
])

const downloadProxyOptions = computed(() => [
  { label: 'direct', value: 'direct' },
  ...props.proxyGroups.map(({ tag }) => ({ label: tag, value: tag }))
])
const supportPayload = computed(() => !['final', 'rule_set', 'fakeip'].includes(fields.value.type))
const supportInvert = computed(() => 'final' !== fields.value.type)
const supportServer = computed(() => 'fakeip' !== fields.value.type)
const multilinePayload = computed(() => 'inline' === fields.value.type)

const { t } = useI18n()
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()

const handleAddRule = () => {
  updateRuleId = -1
  fields.value = {
    id: sampleID(),
    type: 'rule_set',
    payload: '',
    server: 'local-dns',
    invert: false,
    'disable-cache': false,
    'ruleset-name': '',
    'ruleset-format': 'binary',
    'download-detour': ''
  }
  showModal.value = true
}

const handleDeleteRule = (index: number) => {
  rules.value.splice(index, 1)
}

const handleEditRule = (index: number) => {
  updateRuleId = index
  fields.value = deepClone(rules.value[index])
  showModal.value = true
}

const handleAddEnd = () => {
  if (updateRuleId !== -1) {
    rules.value[updateRuleId] = fields.value
  } else {
    rules.value.push(fields.value)
  }
}

const handleUseRuleset = (ruleset: RuleSetType) => {
  fields.value.payload = ruleset.id
}

const hasError = (r: ProfileType['dnsRulesConfig'][0]) => {
  if (r.type !== 'inline') return false
  return !isValidInlineRuleJson(r.payload)
}

const showError = () => message.info('kernel.rules.inlineRuleError')

const generateRuleDesc = (rule: ProfileType['dnsRulesConfig'][0]) => {
  const { type, payload, server, invert } = rule
  const opt = DnsRulesTypeOptions.filter((v) => v.value === type)
  let ruleStr = opt.length > 0 ? t(opt[0].label) : type
  if (!['final', 'ip_is_private', 'src_ip_is_private', 'fakeip'].includes(type)) {
    if (type === 'rule_set') {
      const rulesetsStore = useRulesetsStore()
      const ruleset = rulesetsStore.getRulesetById(payload)
      if (ruleset) {
        ruleStr += ',' + ruleset.tag
      }
    } else if (type === 'rule_set_url') {
      ruleStr += ',' + rule['ruleset-name']
    } else {
      ruleStr += ',' + payload
    }
  }

  if (invert) {
    ruleStr += ',' + t('kernel.rules.invert')
  }

  if (type !== 'fakeip') {
    ruleStr += ',' + t('kernel.dns.' + server)
  }
  return ruleStr
}

watch(rules, (v) => emits('update:modelValue', v), { immediate: true, deep: true })
</script>

<template>
  <div>
    <div v-draggable="[rules, DraggableOptions]">
      <Card v-for="(r, index) in rules" :key="r.id" class="rules-item">
        <div class="name">
          <span v-if="hasError(r)" @click="showError" class="warn"> [ ! ] </span>
          {{ generateRuleDesc(r) }}
        </div>
        <div class="action">
          <Button @click="handleEditRule(index)" type="text" size="small">
            {{ t('common.edit') }}
          </Button>
          <Button @click="handleDeleteRule(index)" type="text" size="small">
            {{ t('common.delete') }}
          </Button>
        </div>
      </Card>
    </div>

    <div style="display: flex; justify-content: center">
      <Button type="link" @click="handleAddRule">{{ t('common.add') }}</Button>
    </div>
  </div>

  <Modal v-model:open="showModal" @ok="handleAddEnd" max-width="80" max-height="80">
    <div class="form-item">
      {{ t('kernel.rules.type.name') }}
      <Select v-model="fields.type" :options="DnsRulesTypeOptions" />
    </div>
    <div v-show="supportPayload" class="form-item">
      {{ t('kernel.rules.payload') }}
      <Input v-show="!multilinePayload" v-model="fields.payload" autofocus />
      <CodeViewer v-show="multilinePayload" v-model="fields.payload" editable />
    </div>
    <div v-show="supportServer" class="form-item">
      DNS
      <Select v-model="fields.server" :options="dnsOptions" />
    </div>
    <div v-show="supportInvert" class="form-item">
      {{ t('kernel.rules.invert') }}
      <Switch v-model="fields.invert" />
    </div>
    <div v-show="supportInvert" class="form-item">
      {{ t('kernel.rules.disable-cache') }}
      <Switch v-model="fields['disable-cache']" />
    </div>

    <template v-if="fields.type === 'rule_set'">
      <Divider>{{ t('kernel.rules.rulesets') }}</Divider>
      <div class="rulesets">
        <Empty v-if="rulesetsStore.rulesets.length === 0" :description="t('kernel.rules.empty')" />
        <template v-else>
          <Card
            v-for="ruleset in rulesetsStore.rulesets"
            :key="ruleset.tag"
            @click="handleUseRuleset(ruleset)"
            :selected="fields.payload === ruleset.id"
            :title="ruleset.tag"
            class="ruleset"
          >
            {{ ruleset.path }}
          </Card>
        </template>
      </div>
    </template>

    <template v-if="fields.type === 'rule_set_url'">
      <Divider>{{ t('kernel.rules.ruleset') }}</Divider>
      <div class="ruleseturl">
        <div class="form-item">
          {{ t('kernel.rules.name') }}
          <Input v-model="fields['ruleset-name']" />
        </div>
        <div class="form-item">
          {{ t('ruleset.format.name') }}
          <Select v-model="fields['ruleset-format']" :options="RulesetFormatOptions" />
        </div>
        <div class="form-item">
          {{ t('kernel.rules.download-detour') }}
          <Select v-model="fields['download-detour']" :options="downloadProxyOptions" />
        </div>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.rules-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 2px;
  .name {
    font-weight: bold;
    .warn {
      color: rgb(200, 193, 11);
      cursor: pointer;
    }
  }
  .action {
    margin-left: auto;
  }
}

.rulesets {
  display: flex;
  flex-wrap: wrap;
  .ruleset {
    width: calc(33.3333% - 16px);
    margin: 8px;
    font-size: 10px;
  }
}
</style>
