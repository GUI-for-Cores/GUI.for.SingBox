<script setup lang="ts">
import { ref, inject, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { Readfile, Writefile } from '@/bridge'
import { type RuleSetType, useRulesetsStore } from '@/stores'
import { deepClone, ignoredError, isValidJson, message } from '@/utils'

import Button from '@/components/Button/index.vue'

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
const rulesetsStore = useRulesetsStore()

const handleSave = async () => {
  if (!ruleset.value) return
  loading.value = true
  try {
    if (!isValidJson(rulesetContent.value)) {
      throw 'syntax error'
    }
    await Writefile(ruleset.value.path, rulesetContent.value)
    handleSubmit()
  } catch (error: any) {
    message.error(error)
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

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <CodeViewer v-if="initialized" v-model="rulesetContent" lang="json" editable class="h-full" />
</template>
