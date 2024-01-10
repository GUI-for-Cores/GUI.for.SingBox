<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, inject } from 'vue'

import { useMessage } from '@/hooks'
import { deepClone, ignoredError, isValidInlineRuleJson } from '@/utils'
import { Readfile, Writefile } from '@/utils/bridge'
import { type RuleSetType, useRulesetsStore } from '@/stores'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const ruleset = ref<RuleSetType>()
const rulesetContent = ref<string>('')
const initialized = ref(false)

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const { t } = useI18n()
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()

const handleSave = async () => {
  if (!ruleset.value) return
  loading.value = true
  try {
    if (!isValidInlineRuleJson(rulesetContent.value)) {
      throw 'syntax error'
    }
    await Writefile(ruleset.value.path, rulesetContent.value)
    message.info('common.success')
    handleSubmit()
  } catch (error: any) {
    message.info(error)
    console.log(error)
  } finally {
    loading.value = false
  }
}

const initContent = async () => {
  const r = rulesetsStore.getRulesetById(props.id)
  if (r) {
    ruleset.value = deepClone(r)
    const content = (await ignoredError(Readfile, r.path)) || ''
    rulesetContent.value = content
  }
  initialized.value = true
}

initContent()
</script>

<template>
  <div class="ruleset-view">
    <CodeViewer v-if="initialized" v-model="rulesetContent" lang="json" editable />
    <div class="action">
      <Button @click="handleCancel" :disable="loading">
        {{ t('common.cancel') }}
      </Button>
      <Button @click="handleSave" :loading="loading" type="primary">
        {{ t('common.save') }}
      </Button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.ruleset-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  overflow: auto;
}

.action {
  align-self: flex-end;
  margin-top: 5px;
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
