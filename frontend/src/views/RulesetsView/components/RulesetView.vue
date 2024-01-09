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
const defaultRulesetContent = ref<string>('')
const rulesetContent = ref<string>('')

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

const resetContent = () => {
  rulesetContent.value = deepClone(defaultRulesetContent.value)
}

const initContent = async () => {
  const r = rulesetsStore.getRulesetById(props.id)
  if (r) {
    ruleset.value = deepClone(r)
    const content = (await ignoredError(Readfile, r.path)) || ''
    defaultRulesetContent.value = deepClone(content)
    rulesetContent.value = content
  }
}

initContent()
</script>

<template>
  <div class="ruleset-view">
    <div class="form">
      <Button @click="resetContent" class="mr-8">
        {{ t('common.reset') }}
      </Button>
    </div>
    <CodeViewer v-model="rulesetContent" editable />
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
}
.form {
  position: sticky;
  top: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  align-self: flex-end;
  background-color: var(--modal-bg);
  backdrop-filter: blur(2px);
  .label {
    padding: 0 8px;
    font-size: 12px;
  }
}
.rules {
  margin-top: 8px;
  flex: 1;
  overflow-y: auto;

  .rule {
    display: inline-block;
    width: calc(33.33% - 4px);
    margin: 2px;
    padding: 8px;
    word-break: break-all;
    font-size: 12px;
    background: var(--card-bg);
  }
}

.action {
  display: flex;
  margin-top: 8px;
  justify-content: flex-end;
}

.mr-8 {
  margin-right: 8px;
}

.code-viewer {
  margin-top: 2px;
  height: 100%;
}
</style>
