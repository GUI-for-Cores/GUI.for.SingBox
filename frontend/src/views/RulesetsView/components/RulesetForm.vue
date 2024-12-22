<script setup lang="ts">
import { ref, inject, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { deepClone, sampleID } from '@/utils'
import { type RuleSetType, useRulesetsStore } from '@/stores'
import { RulesetFormat } from '@/enums/kernel'
import { RulesetFormatOptions } from '@/constant/kernel'

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
  count: 0,
  path: `data/rulesets/${sampleID()}.srs`,
  disabled: false
})

const { t } = useI18n()
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()

const handleCancel = inject('cancel') as any

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

const disabled = computed(
  () =>
    !ruleset.value.tag ||
    (ruleset.value.type === 'Manual' && !ruleset.value.path) ||
    (['Http', 'File'].includes(ruleset.value.type) && (!ruleset.value.url || !ruleset.value.path))
)

watch(
  () => ruleset.value.type,
  (v) => {
    if (v === 'Manual') {
      ruleset.value.format = RulesetFormat.Source
    }
  }
)

watch(
  () => ruleset.value.format,
  (v, old) => {
    const isJson = v === RulesetFormat.Source
    if (!isJson && ruleset.value.type === 'Manual') {
      ruleset.value.format = old
      message.error('Not support')
      return
    }
    ruleset.value.path = ruleset.value.path.replace(
      isJson ? '.srs' : '.json',
      isJson ? '.json' : '.srs'
    )
  }
)

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
    <div v-show="ruleset.type !== 'Manual'" class="form-item">
      <div class="name">
        {{ t('ruleset.format.name') }}
      </div>
      <Radio v-model="ruleset.format" :options="RulesetFormatOptions" />
    </div>
    <div class="form-item">
      <div class="name">{{ t('ruleset.name') }} *</div>
      <Input v-model="ruleset.tag" auto-size autofocus class="input" />
    </div>
    <div v-show="ruleset.type !== 'Manual'" class="form-item">
      <div class="name">{{ t('ruleset.url') }} *</div>
      <Input
        v-model="ruleset.url"
        :placeholder="
          ruleset.type === 'Http'
            ? 'http(s)://'
            : 'data/local/{filename}.' + (ruleset.format === RulesetFormat.Binary ? 'srs' : 'json')
        "
        auto-size
        class="input"
      />
    </div>
    <div class="form-item">
      <div class="name">{{ t('ruleset.path') }} *</div>
      <Input
        v-model="ruleset.path"
        :placeholder="`data/rulesets/{filename}.${ruleset.format === RulesetFormat.Binary ? 'srs' : 'json'}`"
        auto-size
        class="input"
      />
    </div>
  </div>

  <div class="form-action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button @click="handleSubmit" :loading="loading" :disabled="disabled" type="primary">
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
