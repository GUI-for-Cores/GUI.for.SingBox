<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'

import { useMessage } from '@/hooks'
import { deepClone, sampleID } from '@/utils'
import { type ProfileType, useRulesetsStore, type RuleSetType } from '@/stores'
import { RulesTypeOptions, DraggableOptions, RulesetFormatOptions } from '@/constant'

interface Props {
  modelValue: ProfileType['rulesConfig']
  proxyGroups: ProfileType['proxyGroupsConfig']
  profile: ProfileType
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
  type: 'domain',
  payload: '',
  proxy: '',
  invert: false,
  'ruleset-name': '',
  'ruleset-format': 'binary',
  'download-detour': ''
})

const proxyOptions = computed(() => [
  { label: 'direct', value: 'direct' },
  { label: 'block', value: 'block' },
  { label: 'dns-out', value: 'dns-out' },
  ...props.proxyGroups.map(({ tag }) => ({ label: tag, value: tag }))
])

const supportPayload = computed(() => !['final', 'rule_set', 'ip_is_private', 'src_ip_is_private'].includes(fields.value.type))
const supportInvert = computed(() => 'final' !== fields.value.type)

const { t } = useI18n()
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()

const handleAddRule = () => {
  updateRuleId = -1
  fields.value = {
    id: sampleID(),
    type: 'domain',
    payload: '',
    proxy: '',
    invert: false,
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

const hasLost = (r: ProfileType['rulesConfig'][0]) => {
  if (['direct', 'block', 'dns-out'].includes(r.proxy)) return false
  return !props.profile.proxyGroupsConfig.find((v) => v.tag === r.proxy)
}

const showLost = () => message.info('kernel.rules.notFound')

const generateRuleDesc = (rule: ProfileType['rulesConfig'][0]) => {
  const { type, payload, proxy, invert } = rule
  const opt = RulesTypeOptions.filter((v) => v.value === type)
  let ruleStr = opt.length > 0 ? t(opt[0].label) :  type
  if (!['final', 'ip_is_private', 'src_ip_is_private'].includes(type)) {
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
  
  if(invert) {
    ruleStr += ',' + t('kernel.rules.invert')
  }

  ruleStr += ',' + proxy
  return ruleStr
}

watch(rules, (v) => emits('update:modelValue', v), { immediate: true, deep: true })
</script>

<template>
  <div>
    <div v-draggable="[rules, DraggableOptions]">
      <Card v-for="(r, index) in rules" :key="r.id" class="rules-item">
        <div class="name">
          <span v-if="hasLost(r)" @click="showLost" class="warn"> [ ! ] </span>
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
      <Select v-model="fields.type" :options="RulesTypeOptions" />
    </div>
    <div v-show="supportPayload" class="form-item">
      {{ t('kernel.rules.payload') }}
      <Input v-model="fields.payload" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.proxy') }}
      <Select v-model="fields.proxy" :options="proxyOptions" />
    </div>
    <div v-show="supportInvert" class="form-item">
      {{ t('kernel.rules.invert') }}
      <Switch v-model="fields.invert" />
    </div>

    <template v-if="fields.type === 'rule_set'">
      <Divider>{{ t('kernel.rules.rulesets') }}</Divider>
      <div class="rulesets">
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
          <Select v-model="fields['download-detour']" :options="proxyOptions" />
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
