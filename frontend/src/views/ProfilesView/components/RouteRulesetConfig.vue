<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils'
import { useRulesetsStore } from '@/stores'
import { useBool, useMessage } from '@/hooks'
import { DraggableOptions } from '@/constant/app'
import { DefaultRouteRuleset } from '@/constant/profile'
import { RulesetFormat, RulesetType } from '@/enums/kernel'
import { RulesetFormatOptions, RulesetTypeOptions } from '@/constant/kernel'

interface Props {
  outboundOptions: { label: string; value: string }[]
}

defineProps<Props>()

const model = defineModel<IRuleSet[]>({ default: DefaultRouteRuleset() })

let rulesetId = 0
const fields = ref<IRuleSet>(DefaultRouteRuleset())

const { t } = useI18n()
const [showEditModal] = useBool(false)
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()

const handleAdd = () => {
  rulesetId = -1
  fields.value = DefaultRouteRuleset()
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (rulesetId !== -1) {
    model.value[rulesetId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
}

const handleEdit = (index: number) => {
  rulesetId = index
  fields.value = deepClone(model.value[index])
  showEditModal.value = true
}

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const showLost = () => message.warn('kernel.route.rule_set.notFound')

const hasLost = (ruleset: IRuleSet) => {
  if (ruleset.type !== RulesetType.Local) return false
  return !rulesetsStore.getRulesetById(ruleset.path)
}

const handleUse = (ruleset: any) => {
  fields.value.path = ruleset.id
  fields.value.tag = ruleset.tag
  fields.value.format = ruleset.format
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
    <Card v-for="(ruleset, index) in model" :key="ruleset.id" class="ruleset-item">
      <div class="font-bold">
        <span v-if="hasLost(ruleset)" @click="showLost" class="warn"> [ ! ] </span>
        <Tag color="cyan">{{ ruleset.tag }}</Tag>
        <Tag>
          {{ t('kernel.route.rule_set.type.' + ruleset.type) }}
          {{
            t(
              'kernel.route.rule_set.format.' +
                (ruleset.type === RulesetType.Inline ? RulesetFormat.Source : ruleset.format)
            )
          }}
        </Tag>
        <template v-if="ruleset.type === RulesetType.Inline">
          {{ ruleset.rules }}
        </template>
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
    title="kernel.route.tab.rule_set"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.route.rule_set.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.route.rule_set.type.name') }}
      <Radio v-model="fields.type" :options="RulesetTypeOptions" />
    </div>
    <template v-if="fields.type === RulesetType.Local">
      <Divider>{{ t('kernel.route.tab.rule_set') }}</Divider>
      <div class="rulesets">
        <Empty
          v-if="rulesetsStore.rulesets.length === 0"
          :description="t('kernel.route.rule_set.empty')"
        />
        <template v-else>
          <Card
            v-for="ruleset in rulesetsStore.rulesets"
            :key="ruleset.tag"
            :title="ruleset.tag"
            @click="handleUse(ruleset)"
            :selected="fields.path === ruleset.id"
            v-tips="ruleset.path"
            class="ruleset"
          >
            {{ ruleset.path }}
          </Card>
        </template>
      </div>
    </template>
    <template v-else-if="fields.type === RulesetType.Remote">
      <div class="form-item">
        {{ t('kernel.route.rule_set.format.name') }}
        <Radio v-model="fields.format" :options="RulesetFormatOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rule_set.url') }}
        <Input v-model="fields.url" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rule_set.download_detour') }}
        <Select v-model="fields.download_detour" :options="outboundOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.rule_set.update_interval') }}
        <Input v-model="fields.update_interval" editable />
      </div>
    </template>
    <template v-else-if="fields.type === RulesetType.Inline">
      <CodeViewer v-model="fields.rules" lang="json" editable />
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.ruleset-item {
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
