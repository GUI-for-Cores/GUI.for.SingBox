<script setup lang="ts">
import { ref, inject, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { PluginTriggerEvent } from '@/enums/app'
import { usePluginsStore, useAppSettingsStore } from '@/stores'
import { deepClone, message, sampleID } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { PluginConfiguration } from '@/types/app'

interface Props {
  id: string
}

const props = defineProps<Props>()

const key = ref(sampleID())
const loading = ref(false)
const settings = ref<Record<string, any>>({})
const oldSettings = ref<Record<string, any>>({})
const configuration = ref<PluginConfiguration[]>([])

const { t } = useI18n()
const pluginsStore = usePluginsStore()
const appSettingsStore = useAppSettingsStore()

const handleCancel = inject('cancel') as any

const handleSubmit = async () => {
  loading.value = true
  try {
    await pluginsStore.manualTrigger(
      props.id,
      PluginTriggerEvent.OnConfigure,
      settings.value,
      oldSettings.value,
    )
  } catch (error: any) {
    const errors = [
      props.id + ' Not Found',
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
  appSettingsStore.app.pluginSettings[props.id] = settings.value
  handleCancel()
  message.success('common.success')
}

const getOptions = (val: string[]) => {
  return val.map((v) => {
    const arr = v.split(',')
    return { label: arr[0], value: arr[1] || arr[0] }
  })
}

const handleRestoreConfiguration = (showMessage = false) => {
  settings.value = {}
  configuration.value.forEach(({ key, value }) => (settings.value[key] = deepClone(value)))
  key.value = sampleID()
  showMessage && message.success('common.success')
}

const p = pluginsStore.getPluginById(props.id)
if (p) {
  configuration.value = p.configuration
  const _settings = appSettingsStore.app.pluginSettings[p.id]
  if (_settings) {
    settings.value = deepClone(_settings)
  } else {
    // Fill with default value
    handleRestoreConfiguration()
  }
  oldSettings.value = deepClone(settings.value)
}

const modalSlots = {
  action: () =>
    h(
      Button,
      {
        type: 'link',
        class: 'mr-auto',
        onClick: () => handleRestoreConfiguration(true),
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
        onClick: handleSubmit,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div>
    <Card
      v-for="(conf, index) in configuration"
      :key="conf.id"
      :title="`${index + 1}、${conf.title}`"
      class="mb-8"
    >
      <div class="mb-8 text-12">{{ conf.description }}</div>
      <Component
        v-model="settings[conf.key]"
        :key="key"
        :is="conf.component"
        :options="getOptions(conf.options)"
        :autofocus="false"
        editable
      />
    </Card>
  </div>
</template>
