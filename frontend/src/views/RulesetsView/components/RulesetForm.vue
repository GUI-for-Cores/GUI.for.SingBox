<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { deepClone, sampleID } from '@/utils'
import { type RuleSetType, useRulesetsStore } from '@/stores'
import { RulesetFormat, RulesetFormatOptions } from '@/constant'

interface Props {
  id?: string
  isUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false
})

const loading = ref(false)

const ruleset = ref<RuleSetType>({
  id: sampleID(),
  tag: '',
  updateTime: 0,
  format: RulesetFormat.Binary,
  type: 'Http',
  url: '',
  path: `data/rulesets/${sampleID()}.srs`,
  disabled: false
})

const { t } = useI18n()
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()

const handleCancel = inject('cancel') as any
const isManual = () => {
  if (ruleset.value.type === 'Manual' && ruleset.value.format === RulesetFormat.Binary) {
    ruleset.value.format = RulesetFormat.Source
  }
  updatePostfix()
  return ruleset.value.type === 'Manual'
}

const updatePostfix = async () => {
  const source = ruleset.value.format === RulesetFormat.Source ? '.srs' : '.json'
  const target = ruleset.value.format === RulesetFormat.Source ? '.json' : '.srs'
  if (ruleset.value.path.endsWith(source)) {
    ruleset.value.path = ruleset.value.path.replace(source, target)
  }
}

const handleSubmit = async () => {
  loading.value = true

  if (props.isUpdate) {
    try {
      await rulesetsStore.editRuleset(props.id, ruleset.value)
      handleCancel()
    } catch (error: any) {
      console.error('editRuleset: ', error)
      message.error(error)
    }

    loading.value = true

    return
  }

  try {
    await rulesetsStore.addRuleset(ruleset.value)
    handleCancel()
  } catch (error: any) {
    console.error('addRuleset: ', error)
    message.error(error)
  }

  loading.value = true
}

if (props.isUpdate) {
  const r = rulesetsStore.getRulesetById(props.id)
  if (r) {
    ruleset.value = deepClone(r)
  }
}
</script>

<template>
  <div class="form">
    <div class="form-item">
      <div class="name">
        {{ t('ruleset.rulesetType') }}
      </div>
      <Radio
        v-model="ruleset.type"
        :options="[
          { label: 'common.http', value: 'Http' },
          { label: 'common.file', value: 'File' },
          { label: 'ruleset.manual', value: 'Manual' }
        ]"
      />
    </div>
    <div v-show="!isManual()" class="form-item">
      <div class="name">
        {{ t('ruleset.format.name') }}
      </div>
      <Radio v-model="ruleset.format" :options="RulesetFormatOptions" />
    </div>
    <div class="form-item">
      <div class="name">{{ t('ruleset.name') }} *</div>
      <Input v-model="ruleset.tag" auto-size autofocus class="input" />
    </div>
    <div v-show="!isManual()" class="form-item">
      <div class="name">{{ t('ruleset.url') }} *</div>
      <Input
        v-model="ruleset.url"
        :placeholder="
          ruleset.type === 'Http'
            ? 'http(s)://'
            : 'data/local/{filename}.' + (ruleset.format === 'binary' ? 'srs' : 'json')
        "
        auto-size
        class="input"
      />
    </div>
    <div class="form-item">
      <div class="name">{{ t('ruleset.path') }} *</div>
      <Input
        v-model="ruleset.path"
        placeholder="data/rulesets/{filename}.srs"
        auto-size
        class="input"
      />
    </div>
  </div>

  <div class="form-action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button
      @click="handleSubmit"
      :loading="loading"
      :disabled="!ruleset.tag || !ruleset.path || (ruleset.type === 'Http' && !ruleset.url)"
      type="primary"
    >
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.form {
  padding: 0 8px;
  overflow-y: auto;
  max-height: 70vh;
  .name {
    font-size: 14px;
    padding: 8px 0;
    white-space: nowrap;
  }
  .input {
    width: 78%;
  }
}
</style>
