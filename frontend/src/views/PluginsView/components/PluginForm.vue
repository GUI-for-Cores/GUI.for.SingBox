<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { deepClone, ignoredError, sampleID } from '@/utils'
import { PluginsTriggerOptions } from '@/constant'
import { usePluginsStore, type PluginType } from '@/stores'

interface Props {
  id?: string
  isUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false
})

const loading = ref(false)

const oldPluginTriggers = ref()

const pluginID = sampleID()

const plugin = ref<PluginType>({
  id: pluginID,
  name: '',
  description: '',
  type: 'Http',
  url: '',
  path: `data/plugins/plugin-${pluginID}.js`,
  triggers: [],
  disabled: false,
  install: false,
  installed: false
})

const { t } = useI18n()
const { message } = useMessage()
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any

const handleSubmit = async () => {
  loading.value = true
  try {
    if (props.isUpdate) {
      await pluginsStore.editPlugin(props.id, plugin.value)
      if (plugin.value.triggers.sort().join('') !== oldPluginTriggers.value) {
        pluginsStore.updatePluginTrigger(plugin.value)
      }
    } else {
      await pluginsStore.addPlugin(plugin.value)
      // Try to autoload the plugin
      await ignoredError(pluginsStore.reloadPlugin, plugin.value)
      pluginsStore.updatePluginTrigger(plugin.value)
    }
  } catch (error: any) {
    console.error(error)
    message.info(error)
  }
  handleCancel()
  loading.value = true
}

if (props.isUpdate) {
  const p = pluginsStore.getPluginById(props.id)
  if (p) {
    plugin.value = deepClone(p)
    oldPluginTriggers.value = p.triggers.sort().join('')
  }
}
</script>

<template>
  <div class="form-item">
    <div class="name">
      {{ t('plugin.type') }}
    </div>
    <Radio
      v-model="plugin.type"
      :options="[
        { label: 'plugin.http', value: 'Http' },
        { label: 'plugin.file', value: 'File' }
      ]"
    />
  </div>
  <div class="form-item">
    {{ t('plugin.trigger') }}
  </div>
  <div class="form-item justify-center">
    <CheckBox v-model="plugin.triggers" :options="PluginsTriggerOptions" />
  </div>
  <div class="form-item">
    {{ t('plugin.install') }}
    <Switch v-model="plugin.install" />
  </div>
  <div class="form-item">
    * {{ t('plugin.name') }}
    <Input v-model="plugin.name" auto-size autofocus class="input" />
  </div>
  <div v-show="plugin.type === 'Http'" class="form-item">
    <div class="name">* {{ t('plugin.url') }}</div>
    <Input
      v-model="plugin.url"
      :placeholder="plugin.type === 'Http' ? 'http(s)://' : 'data/local/plugin-{filename}.js'"
      auto-size
      class="input"
    />
  </div>
  <div class="form-item">
    * {{ t('plugin.path') }}
    <Input
      v-model="plugin.path"
      placeholder="data/plugins/plugin-{filename}.js"
      auto-size
      autofocus
      class="input"
    />
  </div>
  <div class="form-item">
    {{ t('plugin.description') }}
    <Input v-model="plugin.description" auto-size autofocus class="input" />
  </div>

  <div class="action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button
      @click="handleSubmit"
      :loading="loading"
      :disable="!plugin.name || !plugin.path || (plugin.type === 'Http' && !plugin.url)"
      type="primary"
    >
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.form-item {
  margin-bottom: 4px;
  .input {
    width: 80%;
  }
}
.action {
  display: flex;
  justify-content: flex-end;
}

.justify-center {
  justify-content: center;
}
</style>
