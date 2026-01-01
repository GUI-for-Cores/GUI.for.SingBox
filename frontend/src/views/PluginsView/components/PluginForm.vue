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
  tags: [],
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

const componentList = [
  'CheckBox',
  'CodeViewer',
  'Input',
  'InputList',
  'KeyValueEditor',
  'Radio',
  'Select',
  'MultipleSelect',
  'Switch',
  'ColorPicker',
] as const

type ComponentType = (typeof componentList)[number]

const { t } = useI18n()
const [showMore, toggleShowMore] = useBool(false)
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleRestore = () => {
  if (official.value) {
    plugin.value = deepClone(official.value)
    message.success('common.success')
  }
}

const handleSave = async () => {
  loading.value = true
  try {
    if (props.id) {
      await pluginsStore.editPlugin(props.id, plugin.value)
    } else {
      await pluginsStore.addPlugin(plugin.value)
    }
    await handleSubmit()
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

const hasOption = (component: ComponentType) => {
  return (
    component !== 'InputList' &&
    ['CheckBox', 'InputList', 'Radio', 'Select', 'MultipleSelect'].includes(component)
  )
}

const onComponentChange = (component: ComponentType, index: number) => {
  switch (component) {
    case 'CheckBox':
    case 'InputList':
    case 'MultipleSelect': {
      plugin.value.configuration[index]!.value = []
      plugin.value.configuration[index]!.options = []
      break
    }
    case 'CodeViewer':
    case 'Input':
    case 'Radio':
    case 'Select': {
      plugin.value.configuration[index]!.value = ''
      break
    }
    case 'ColorPicker': {
      plugin.value.configuration[index]!.value = '#000000'
      break
    }
    case 'KeyValueEditor': {
      plugin.value.configuration[index]!.value = {}
      break
    }
    case 'Switch': {
      plugin.value.configuration[index]!.value = false
      break
    }
  }
  plugin.value.configuration[index]!.component = component
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
        onClick: handleSave,
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
      <div class="mr-8">{{ t('plugin.trigger') }}</div>
      <MultipleSelect v-model="plugin.triggers" :options="PluginsTriggerOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('plugin.name') }} *
      <div class="min-w-[75%]">
        <Input v-model="plugin.name" autofocus class="w-full" />
      </div>
    </div>
    <div class="form-item">
      {{ t('plugin.version') }} *
      <div class="min-w-[75%]">
        <Input v-model="plugin.version" class="w-full" />
      </div>
    </div>
    <div v-show="plugin.type === 'Http'" class="form-item">
      {{ t('plugin.url') }} *
      <div class="min-w-[75%]">
        <Input
          v-model="plugin.url"
          :placeholder="plugin.type === 'Http' ? 'http(s)://' : 'data/local/plugin-{filename}.js'"
          class="w-full"
        />
      </div>
    </div>
    <div class="form-item">
      {{ t('plugin.path') }} *
      <div class="min-w-[75%]">
        <Input
          v-model="plugin.path"
          placeholder="data/plugins/plugin-{filename}.js"
          class="w-full"
        />
      </div>
    </div>
    <div class="form-item">
      {{ t('plugin.description') }}
      <div class="min-w-[75%]">
        <Input v-model="plugin.description" class="w-full" />
      </div>
    </div>
    <Divider>
      <Button type="text" size="small" @click="toggleShowMore">
        {{ t('common.more') }}
      </Button>
    </Divider>
    <div v-show="showMore" class="pb-8">
      <div class="form-item">
        {{ t('plugin.install') }}
        <Switch v-model="plugin.install" />
      </div>
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
      <div
        v-draggable="[plugin.configuration, { ...DraggableOptions, handle: '.drag' }]"
        class="px-8 flex flex-col gap-8"
      >
        <template v-for="(conf, index) in plugin.configuration" :key="conf.id">
          <Card v-if="conf.component" :title="conf.component">
            <template #title-prefix>
              <Icon icon="drag" class="drag cursor-move" />
              <div class="ml-8">{{ index + 1 }}.</div>
            </template>
            <template #extra>
              <Button size="small" type="text" @click="handleDelParam(index)">
                {{ t('common.delete') }}
              </Button>
            </template>
            <div class="form-item">
              {{ t('plugin.confName') }}
              <div class="min-w-[75%]">
                <Input v-model="conf.title" placeholder="title" class="w-full" />
              </div>
            </div>
            <div class="form-item">
              {{ t('plugin.confDescription') }}
              <div class="min-w-[75%]">
                <Input v-model="conf.description" placeholder="description" class="w-full" />
              </div>
            </div>
            <div class="form-item">
              {{ t('plugin.confKey') }}
              <div class="min-w-[75%]">
                <Input v-model="conf.key" placeholder="key" class="w-full" />
              </div>
            </div>
            <div class="form-item" :class="{ 'items-start': conf.value.length !== 0 }">
              {{ t('plugin.confDefault') }}
              <div :class="conf.component === 'CodeViewer' ? 'min-w-[75%]' : ''">
                <Component
                  :is="conf.component"
                  v-model="conf.value"
                  :options="getOptions(conf.options)"
                  editable
                  class="w-full"
                />
              </div>
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
          <Card v-else :title="t('plugin.selectComponent')">
            <template #extra>
              <Button size="small" type="text" @click="handleDelParam(index)">
                {{ t('common.delete') }}
              </Button>
            </template>
            <div class="flex grid grid-cols-4 gap-8">
              <Button
                v-for="item in componentList"
                :key="item"
                @click="onComponentChange(item, index)"
              >
                {{ item }}
              </Button>
            </div>
          </Card>
        </template>
      </div>

      <div :class="plugin.configuration.length !== 0 ? 'mt-8' : ''" class="mx-8">
        <Button type="primary" icon="add" class="w-full" @click="handleAddParam" />
      </div>
    </div>
  </div>
</template>
