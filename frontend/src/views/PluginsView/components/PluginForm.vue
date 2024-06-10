<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBool, useMessage } from '@/hooks'
import { deepClone, ignoredError, sampleID } from '@/utils'
import { usePluginsStore, type PluginType } from '@/stores'
import { PluginsTriggerOptions, DraggableOptions, PluginTrigger } from '@/constant'

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
  type: 'File',
  url: '',
  status: 0,
  path: `data/plugins/plugin-${pluginID}.js`,
  triggers: [PluginTrigger.OnManual],
  menus: {},
  configuration: [],
  disabled: false,
  install: false,
  installed: false
})

const { t } = useI18n()
const { message } = useMessage()
const [showMore, toggleShowMore] = useBool(false)
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any

const handleSubmit = async () => {
  loading.value = true
  try {
    if (props.isUpdate) {
      // Refresh the key to re-render the view
      plugin.value.key = sampleID()
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
    handleCancel()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
  loading.value = false
}

const handleAddParam = async () => {
  plugin.value.configuration.push({
    id: sampleID(),
    title: '',
    description: '',
    key: '',
    component: '',
    value: [],
    options: []
  })
}

const handleDelParam = (index: number) => {
  plugin.value.configuration.splice(index, 1)
}

const hasOption = (component: string) => {
  return (
    component !== 'InputList' && ['CheckBox', 'InputList', 'Radio', 'Select'].includes(component)
  )
}

const onComponentChange = (component: string, index: number) => {
  switch (component) {
    case 'CheckBox':
    case 'InputList': {
      plugin.value.configuration[index].value = []
      plugin.value.configuration[index].options = []
      break
    }
    case 'CodeViewer':
    case 'Input':
    case 'Radio':
    case 'Select': {
      plugin.value.configuration[index].value = ''
      break
    }
    case 'KeyValueEditor': {
      plugin.value.configuration[index].value = {}
      break
    }
    case 'Switch': {
      plugin.value.configuration[index].value = false
      break
    }
  }
  plugin.value.configuration[index].component = component as any
}

const getOptions = (val: string[]) => {
  return val.map((v) => {
    const arr = v.split(',')
    return { label: arr[0], value: arr[1] || arr[0] }
  })
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
  <div class="form">
    <div class="form-item">
      <div class="name">
        {{ t('plugin.type') }}
      </div>
      <Radio
        v-model="plugin.type"
        :options="[
          { label: 'common.http', value: 'Http' },
          { label: 'common.file', value: 'File' }
        ]"
      />
    </div>
    <div class="form-item">
      <div class="name">{{ t('plugin.install') }}</div>
      <Switch v-model="plugin.install" />
    </div>
    <div class="form-item">
      <div style="padding-right: 8px">
        <div class="name">{{ t('plugin.trigger') }}</div>
      </div>
      <CheckBox v-model="plugin.triggers" :options="PluginsTriggerOptions" />
    </div>
    <div class="form-item">
      <div class="name">{{ t('plugin.name') }} *</div>
      <Input v-model="plugin.name" auto-size autofocus class="input" />
    </div>
    <div v-show="plugin.type === 'Http'" class="form-item">
      <div class="name">{{ t('plugin.url') }} *</div>
      <Input
        v-model="plugin.url"
        :placeholder="plugin.type === 'Http' ? 'http(s)://' : 'data/local/plugin-{filename}.js'"
        auto-size
        class="input"
      />
    </div>
    <div class="form-item">
      <div class="name">{{ t('plugin.path') }} *</div>
      <Input
        v-model="plugin.path"
        placeholder="data/plugins/plugin-{filename}.js"
        auto-size
        class="input"
      />
    </div>
    <div class="form-item">
      <div class="name">{{ t('plugin.description') }}</div>
      <Input v-model="plugin.description" auto-size class="input" />
    </div>
    <Divider>
      <Button @click="toggleShowMore" type="text" size="small">
        {{ t('common.more') }}
      </Button>
    </Divider>
    <div v-show="showMore">
      <div class="form-item" :class="{ 'flex-start': Object.keys(plugin.menus).length !== 0 }">
        <div class="name">{{ t('plugin.menus') }}</div>
        <KeyValueEditor
          v-model="plugin.menus"
          :placeholder="[t('plugin.menuKey'), t('plugin.menuValue')]"
        />
      </div>
      <Divider>{{ t('plugin.configuration') }}</Divider>
      <div v-draggable="[plugin.configuration, { ...DraggableOptions, handle: '.drag' }]">
        <template v-for="(conf, index) in plugin.configuration" :key="conf.id">
          <Card v-if="conf.component" :title="conf.component" class="mb-8">
            <template #title-prefix>
              <Icon icon="drag" class="drag" style="cursor: move" />
              <div class="ml-8">{{ index + 1 }}、</div>
            </template>
            <template #extra>
              <Button @click="handleDelParam(index)" size="small" type="text">
                {{ t('common.delete') }}
              </Button>
            </template>
            <div class="form-item">
              <div class="name">{{ t('plugin.confName') }}</div>
              <Input v-model="conf.title" placeholder="title" />
            </div>
            <div class="form-item">
              <div class="name">{{ t('plugin.confDescription') }}</div>
              <Input v-model="conf.description" placeholder="description" />
            </div>
            <div class="form-item">
              <div class="name">{{ t('plugin.confKey') }}</div>
              <Input v-model="conf.key" placeholder="key" />
            </div>
            <div class="form-item" :class="{ 'flex-start': conf.value.length !== 0 }">
              <div class="name">{{ t('plugin.confDefault') }}</div>
              <Component
                :is="conf.component"
                v-model="conf.value"
                :options="getOptions(conf.options)"
                editable
              />
            </div>
            <div
              v-if="hasOption(conf.component)"
              :class="{ 'flex-start': conf.options.length !== 0 }"
              class="form-item"
            >
              <div class="name">{{ t('plugin.options') }}</div>
              <InputList v-model="conf.options" />
            </div>
          </Card>
          <div v-else class="form-item">
            <Select
              @change="(val: string) => onComponentChange(val, index)"
              :options="[
                { label: 'CheckBox', value: 'CheckBox' },
                { label: 'CodeViewer', value: 'CodeViewer' },
                { label: 'Input', value: 'Input' },
                { label: 'InputList', value: 'InputList' },
                { label: 'KeyValueEditor', value: 'KeyValueEditor' },
                { label: 'Radio', value: 'Radio' },
                { label: 'Select', value: 'Select' },
                { label: 'Switch', value: 'Switch' }
              ]"
              placeholder="plugin.selectComponent"
            />
            <Button @click="handleDelParam(index)" size="small" type="text">
              {{ t('common.delete') }}
            </Button>
          </div>
        </template>
      </div>
      <Button @click="handleAddParam" type="primary" size="small" icon="add" class="w-full" />
    </div>
  </div>
  <div class="form-action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button
      @click="handleSubmit"
      :loading="loading"
      :disabled="!plugin.name || !plugin.path || (plugin.type === 'Http' && !plugin.url)"
      type="primary"
    >
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
}
.form-item {
  .input {
    width: 78%;
  }
}

.flex-start {
  align-items: flex-start;
}
</style>
