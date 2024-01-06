<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'
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
  updateTime: '',
  format: RulesetFormat.Binary,
  type: 'Http',
  url: '',
  interval: 86400,
  path: `data/rulesets/${sampleID()}.srs`,
  disabled: false
})

const { t } = useI18n()
const { message } = useMessage()
const [showMore, toggleShowMore] = useBool(false)
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
      message.info(error)
    }

    loading.value = true

    return
  }

  try {
    await rulesetsStore.addRuleset(ruleset.value)
    handleCancel()
  } catch (error: any) {
    console.error('addRuleset: ', error)
    message.info(error)
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
  <div class="form-item">
    <div class="name">
      {{ t('ruleset.rulesetType') }}
    </div>
    <Radio
      v-model="ruleset.type"
      :options="[
        { label: 'ruleset.http', value: 'Http' },
        { label: 'ruleset.file', value: 'File' }
      ]"
    />
  </div>
  <div class="form-item">
    <div class="name">
      {{ t('ruleset.format.name') }}
    </div>
    <Radio v-model="ruleset.format" :options="RulesetFormatOptions" />
  </div>
  <div class="form-item">
    <div class="name">* {{ t('ruleset.name') }}</div>
    <Input v-model="ruleset.tag" auto-size autofocus class="input" />
  </div>
  <div class="form-item">
    <div class="name">* {{ t('ruleset.url') }}</div>
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
    <div class="name">* {{ t('ruleset.path') }}</div>
    <Input
      v-model="ruleset.path"
      placeholder="data/rulesets/{filename}.srs"
      auto-size
      class="input"
    />
  </div>
  <Divider>
    <Button @click="toggleShowMore" type="text" size="small">
      {{ t('common.more') }}
    </Button>
  </Divider>
  <div v-show="showMore">
    <div class="form-item">
      <div class="name">{{ t('ruleset.interval') }}</div>
      <Input
        v-model="ruleset.interval"
        placeholder="data/rulesets/{filename}.srs"
        auto-size
        type="number"
      />
    </div>
  </div>
  <div class="action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button
      @click="handleSubmit"
      :loading="loading"
      :disable="!ruleset.tag || !ruleset.path || (ruleset.type === 'Http' && !ruleset.url)"
      type="primary"
    >
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.form-item {
  margin-bottom: 8px;
  .name {
    font-size: 14px;
    padding: 8px 0;
  }
  .input {
    width: 80%;
  }
}
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
