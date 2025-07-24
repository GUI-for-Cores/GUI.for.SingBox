<script setup lang="ts">
import { ref, inject, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { Readfile, Writefile } from '@/bridge'
import { PluginTriggerEvent } from '@/enums/app'
import { usePluginsStore } from '@/stores'
import { deepClone, ignoredError, message } from '@/utils'

import Button from '@/components/Button/index.vue'
import Dropdown from '@/components/Dropdown/index.vue'

import type { Plugin } from '@/types/app'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const plugin = ref<Plugin>()
const metadata = ref<Record<string, any>>()
const code = ref('')

const { t } = useI18n()
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  if (!plugin.value) return
  loading.value = true
  try {
    await Writefile(plugin.value.path, code.value)
    await pluginsStore.reloadPlugin(plugin.value, code.value, false)
    handleSubmit()
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
  loading.value = false
}

const testing = ref(false)

const handleTest = async (event: PluginTriggerEvent, arg1?: any, arg2?: any) => {
  if (!plugin.value || testing.value) return
  testing.value = true
  try {
    const metadata = JSON.stringify({
      ...pluginsStore.getPluginMetadata(plugin.value),
      Mode: 'Dev',
    })
    if (event === PluginTriggerEvent.OnSubscribe) {
      arg1 = '[]'
      arg2 = '{}'
    } else if (event === PluginTriggerEvent.OnGenerate) {
      arg1 = '{}'
      arg2 = '{}'
    } else if (event === PluginTriggerEvent.OnConfigure) {
      arg1 = metadata
      arg2 = metadata
    }
    const fn = new window.AsyncFunction(
      `const Plugin = ${metadata};\n${code.value}\nreturn await ${event}(${arg1}, ${arg2})`,
    )
    await fn()
    message.success('common.success')
  } catch (error: any) {
    message.error(error.message || error)
  }
  testing.value = false
}

const initPluginCode = async (p: Plugin) => {
  const _code = pluginsStore.getPluginCodefromCache(p.id)
  if (_code) {
    code.value = _code
    return
  }
  const content = (await ignoredError(Readfile, p.path)) || ''
  code.value = content
}

const p = pluginsStore.getPluginById(props.id)
if (p) {
  plugin.value = deepClone(p)
  metadata.value = pluginsStore.getPluginMetadata(plugin.value)
  initPluginCode(p)
}

const modalSlots = {
  action: () => {
    const events = [
      [PluginTriggerEvent.OnManual, 'plugin.on::manual'],
      [PluginTriggerEvent.OnInstall, 'plugin.on::install'],
      [PluginTriggerEvent.OnUninstall, 'plugin.on::uninstall'],
      [PluginTriggerEvent.OnStartup, 'plugin.on::startup'],
      [PluginTriggerEvent.OnShutdown, 'plugin.on::shutdown'],
      [PluginTriggerEvent.OnReady, 'plugin.on::ready'],
      [PluginTriggerEvent.OnTask, 'plugin.on::task'],
      [PluginTriggerEvent.OnConfigure, 'plugin.on::configure'],
      [PluginTriggerEvent.OnSubscribe, 'plugin.on::subscribe'],
      [PluginTriggerEvent.OnGenerate, 'plugin.on::generate'],
      [PluginTriggerEvent.OnCoreStarted, 'plugin.on::core::started'],
      [PluginTriggerEvent.OnCoreStopped, 'plugin.on::core::stopped'],
      [PluginTriggerEvent.OnBeforeCoreStart, 'plugin.on::before::core::start'],
      [PluginTriggerEvent.OnBeforeCoreStop, 'plugin.on::before::core::stop'],
    ] as const

    return h(
      Dropdown,
      {
        trigger: ['hover'],
        placement: 'top',
        class: 'mr-auto',
      },
      {
        default: () =>
          h(
            Button,
            {
              loading: testing.value,
              type: 'link',
            },
            () => t('plugins.testRun'),
          ),
        overlay: () =>
          h(
            'div',
            {
              class: 'p-4 flex flex-col gap-2',
            },
            events.map(([type, label]) =>
              h(
                Button,
                {
                  onClick: () => handleTest(type),
                  type: 'text',
                  size: 'small',
                },
                () => t(label),
              ),
            ),
          ),
      },
    )
  },
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
  <CodeViewer v-model="code" :plugin="metadata" lang="javascript" editable />
</template>
