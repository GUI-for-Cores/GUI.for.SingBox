<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, inject } from 'vue'

import { useMessage } from '@/hooks'
import { Readfile, Writefile } from '@/bridge'
import { PluginTriggerEvent } from '@/constant'
import { deepClone, ignoredError } from '@/utils'
import { usePluginsStore, type PluginType } from '@/stores'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const plugin = ref<PluginType>()
const metadata = ref<Record<string, any>>()
const code = ref('')

const { t } = useI18n()
const { message } = useMessage()
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  if (!plugin.value) return
  loading.value = true
  try {
    await Writefile(plugin.value.path, code.value)
    await pluginsStore.reloadPlugin(plugin.value, code.value)
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
      Mode: 'Dev'
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
    const fn = new AsyncFunction(
      `const Plugin = ${metadata};\n${code.value}\nreturn await ${event}(${arg1}, ${arg2})`
    )
    await fn()
    message.success('common.success')
  } catch (error: any) {
    message.error(error.message || error)
  }
  testing.value = false
}

const initPluginCode = async (p: PluginType) => {
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
</script>

<template>
  <div class="plugin-view">
    <CodeViewer v-model="code" :plugin="metadata" lang="javascript" editable />
  </div>
  <div class="form-action">
    <Dropdown :trigger="['hover']" placement="top" class="mr-auto">
      <Button :loading="testing" type="link">{{ t('plugins.testRun') }}</Button>
      <template #overlay>
        <Button @click="handleTest(PluginTriggerEvent.OnManual)" type="link" size="small">
          {{ t('plugin.on::manual') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnInstall)" type="link" size="small">
          {{ t('plugin.on::install') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnUninstall)" type="link" size="small">
          {{ t('plugin.on::uninstall') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnStartup)" type="link" size="small">
          {{ t('plugin.on::startup') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnShutdown)" type="link" size="small">
          {{ t('plugin.on::shutdown') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnReady)" type="link" size="small">
          {{ t('plugin.on::ready') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnTask)" type="link" size="small">
          {{ t('plugin.on::task') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnConfigure)" type="link" size="small">
          {{ t('plugin.on::configure') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnSubscribe)" type="link" size="small">
          {{ t('plugin.on::subscribe') }}
        </Button>
        <Button @click="handleTest(PluginTriggerEvent.OnGenerate)" type="link" size="small">
          {{ t('plugin.on::generate') }}
        </Button>
      </template>
    </Dropdown>
    <Button @click="handleCancel" :disabled="loading">
      {{ t('common.cancel') }}
    </Button>
    <Button @click="handleSave" :loading="loading" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.plugin-view {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  overflow-y: auto;
  max-height: 70vh;
}
</style>
