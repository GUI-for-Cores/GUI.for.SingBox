<script setup lang="ts">
import { ref, inject, h, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { PluginTriggerEvent } from '@/enums/app'
import { usePluginsStore, useAppSettingsStore } from '@/stores'
import { message } from '@/utils'

import Button from '@/components/Button/index.vue'

import PluginConfigItem from './PluginConfigItem.vue'

import type { Plugin } from '@/types/app'

interface Props {
  plugin: Plugin
}

const props = defineProps<Props>()

const { t } = useI18n()
const pluginsStore = usePluginsStore()
const appSettingsStore = useAppSettingsStore()
const pluginConfigRef = useTemplateRef('pluginConfigRef')

const loading = ref(false)
const settings = ref(appSettingsStore.app.pluginSettings[props.plugin.id] ?? {})
const oldSettings = settings.value
const originalSettings = props.plugin.configuration.reduce((p, { key, value }) => {
  p[key] = value
  return p
}, {} as Recordable)

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true
  try {
    await pluginsStore.manualTrigger(
      props.plugin.id,
      PluginTriggerEvent.OnConfigure,
      Object.assign({}, originalSettings, settings.value),
      Object.assign({}, originalSettings, oldSettings),
    )
  } catch (error: any) {
    const errors = [
      props.plugin.id + ' Not Found',
      'is Missing source code',
      'Disabled',
      "Can't find variable: " + PluginTriggerEvent.OnConfigure,
      PluginTriggerEvent.OnConfigure + ' is not defined',
    ]
    if (errors.every((v) => !error.includes(v))) {
      message.error(error)
      return
    }
  } finally {
    loading.value = false
  }

  if (JSON.stringify(settings.value) === '{}') {
    delete appSettingsStore.app.pluginSettings[props.plugin.id]
  } else {
    appSettingsStore.app.pluginSettings[props.plugin.id] = settings.value
  }

  await handleSubmit()
  message.success('common.success')
}

const modalSlots = {
  action: () =>
    h(
      Button,
      {
        type: 'link',
        class: 'mr-auto',
        onClick: () => pluginConfigRef.value?.reset(),
      },
      () => t('plugin.restore'),
    ),
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
  <PluginConfigItem ref="pluginConfigRef" :plugin="props.plugin" v-model="settings" />
</template>
