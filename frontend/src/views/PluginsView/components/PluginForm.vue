<script setup lang="ts">
import { ref, inject, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { PluginsTriggerOptions, DraggableOptions } from '@/constant/app'
import { PluginTrigger } from '@/enums/app'
import { useBool } from '@/hooks'
import { usePluginsStore } from '@/stores'
import { deepClone, message, sampleID } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { Plugin } from '@/types/app'

interface Props {
  id?: string
}

const props = defineProps<Props>()

const official = computed(() => pluginsStore.findPluginInHubById(plugin.value.id))
const loading = ref(false)
const pluginID = sampleID()
const plugin = ref<Plugin>({
  id: pluginID,
  version: 'v1.0.0',
  name: '',
  description: '',
  type: 'File',
  url: '',
  status: 0,
  path: `data/plugins/plugin-${pluginID}.js`,
  triggers: [PluginTrigger.OnManual],
  hasUI: false,
  menus: {},
  context: {
    profiles: {},
    subscriptions: {},
    rulesets: {},
    plugins: {},
    scheduledtasks: {},
  },
  configuration: [],
  disabled: false,
  install: false,
  installed: false,
})

const { t } = useI18n()
const [showMore, toggleShowMore] = useBool(false)
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any

const handleRestore = () => {
  if (official.value) {
    plugin.value = deepClone(official.value)
    message.success('common.success')
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    if (props.id) {
      await pluginsStore.editPlugin(props.id, plugin.value)
    } else {
      await pluginsStore.addPlugin(plugin.value)
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
    options: [],
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

if (props.id) {
  const p = pluginsStore.getPluginById(props.id)
  p && (plugin.value = deepClone(p))
}

const modalSlots = {
  action: () =>
    official.value
      ? h(Button, { type: 'link', class: 'mr-auto', onClick: handleRestore }, () =>
          t('plugin.restore'),
        )
      : undefined,
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
        disabled:
          !plugin.value.name ||
          !plugin.value.version ||
          !plugin.value.path ||
          (plugin.value.type === 'Http' && !plugin.value.url),
        onClick: handleSubmit,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div class="w-full h-full">
    <div class="form-item">
      {{ t('plugin.type') }}
      <Radio
        v-model="plugin.type"
        :options="[
          { label: 'common.http', value: 'Http' },
          { label: 'common.file', value: 'File' },
        ]"
      />
    </div>
    <div class="form-item">
      {{ t('plugin.install') }}
      <Switch v-model="plugin.install" />
    </div>
    <div class="form-item">
      <div class="mr-8">{{ t('plugin.trigger') }}</div>
      <CheckBox v-model="plugin.triggers" :options="PluginsTriggerOptions.slice(0, 6)" />
    </div>
    <div class="form-item">
      <div class="name"></div>
      <CheckBox v-model="plugin.triggers" :options="PluginsTriggerOptions.slice(6)" />
    </div>
    <div class="form-item">
      {{ t('plugin.name') }} *
      <Input v-model="plugin.name" autofocus class="min-w-[75%]" />
    </div>
    <div class="form-item">
      {{ t('plugin.version') }} *
      <Input v-model="plugin.version" class="min-w-[75%]" />
    </div>
    <div v-show="plugin.type === 'Http'" class="form-item">
      {{ t('plugin.url') }} *
      <Input
        v-model="plugin.url"
        :placeholder="plugin.type === 'Http' ? 'http(s)://' : 'data/local/plugin-{filename}.js'"
        class="min-w-[75%]"
      />
    </div>
    <div class="form-item">
      {{ t('plugin.path') }} *
      <Input
        v-model="plugin.path"
        placeholder="data/plugins/plugin-{filename}.js"
        class="min-w-[75%]"
      />
    </div>
    <div class="form-item">
      {{ t('plugin.description') }}
      <Input v-model="plugin.description" class="min-w-[75%]" />
    </div>
    <Divider>
      <Button @click="toggleShowMore" type="text" size="small">
        {{ t('common.more') }}
      </Button>
    </Divider>
    <div v-show="showMore" class="pb-8">
      <div class="form-item">
        {{ t('plugin.hasUI') }}
        <Switch v-model="plugin.hasUI" />
      </div>
      <div class="form-item" :class="{ 'items-start': Object.keys(plugin.menus).length !== 0 }">
        {{ t('plugin.menus') }}
        <KeyValueEditor
          v-model="plugin.menus"
          :placeholder="[t('plugin.menuKey'), t('plugin.menuValue')]"
        />
      </div>
      <div
        :class="{ 'items-start': Object.keys(plugin.context.profiles).length !== 0 }"
        class="form-item"
      >
        {{ t('plugin.context') }} - {{ t('router.profiles') }}
        <KeyValueEditor
          v-model="plugin.context.profiles"
          :placeholder="[t('plugin.menuKey'), t('plugin.menuValue')]"
        />
      </div>
      <div
        :class="{ 'items-start': Object.keys(plugin.context.subscriptions).length !== 0 }"
        class="form-item"
      >
        {{ t('plugin.context') }} - {{ t('router.subscriptions') }}
        <KeyValueEditor
          v-model="plugin.context.subscriptions"
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
              {{ t('plugin.confName') }}
              <Input v-model="conf.title" placeholder="title" />
            </div>
            <div class="form-item">
              {{ t('plugin.confDescription') }}
              <Input v-model="conf.description" placeholder="description" />
            </div>
            <div class="form-item">
              {{ t('plugin.confKey') }}
              <Input v-model="conf.key" placeholder="key" />
            </div>
            <div class="form-item" :class="{ 'items-start': conf.value.length !== 0 }">
              {{ t('plugin.confDefault') }}
              <Component
                :is="conf.component"
                v-model="conf.value"
                :options="getOptions(conf.options)"
                editable
              />
            </div>
            <div
              v-if="hasOption(conf.component)"
              :class="{ 'items-start': conf.options.length !== 0 }"
              class="form-item"
            >
              {{ t('plugin.options') }}
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
                { label: 'Switch', value: 'Switch' },
              ]"
              placeholder="plugin.selectComponent"
            />
            <Button @click="handleDelParam(index)" size="small" type="text">
              {{ t('common.delete') }}
            </Button>
          </div>
        </template>
      </div>
      <Button @click="handleAddParam" type="primary" icon="add" class="w-full" />
    </div>
  </div>
</template>
