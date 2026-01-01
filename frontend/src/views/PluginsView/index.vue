<script setup lang="ts">
import { computed } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { OpenURI } from '@/bridge'
import { DraggableOptions, ViewOptions } from '@/constant/app'
import { PluginTriggerEvent, PluginTrigger, View } from '@/enums/app'
import { usePluginsStore, useAppSettingsStore, useEnvStore } from '@/stores'
import { debounce, message } from '@/utils'

import Button from '@/components/Button/index.vue'
import { useModal } from '@/components/Modal'

import PluginChangelog from './components/PluginChangelog.vue'
import PluginConfigurator from './components/PluginConfigurator.vue'
import PluginForm from './components/PluginForm.vue'
import PluginHub from './components/PluginHub.vue'
import PluginView from './components/PluginView.vue'

import type { Menu, Plugin } from '@/types/app'

const menuList: Menu[] = [
  {
    label: 'plugins.reload',
    handler: async (id: string) => {
      const plugin = pluginsStore.getPluginById(id)
      try {
        await pluginsStore.reloadPlugin(plugin!)
        message.success('common.success')
      } catch (error: any) {
        console.log(error)
        message.error(error)
      }
    },
  },
  {
    label: 'common.openFile',
    handler: async (id: string) => {
      const plugin = pluginsStore.getPluginById(id)
      await OpenURI(envStore.env.basePath + '/' + plugin!.path)
    },
  },
]

const { t } = useI18n()
const [Modal, modalApi] = useModal({})

const envStore = useEnvStore()
const pluginsStore = usePluginsStore()
const appSettingsStore = useAppSettingsStore()

const handleImportPlugin = () => {
  modalApi.setProps({
    title: 'plugins.hub',
    height: '90',
    width: '90',
    submit: false,
    maskClosable: true,
    cancelText: 'common.close',
  })
  modalApi.setContent(PluginHub).open()
}

const openPluginFormModal = (id?: string) => {
  modalApi.setProps({ title: id ? 'common.edit' : 'common.add', minWidth: '80' })
  modalApi.setContent(PluginForm, { id }).open()
}

const handleAddPlugin = () => {
  openPluginFormModal()
}

const handleEditPlugin = (id: string) => {
  openPluginFormModal(id)
}

const handleViewChangelog = (id: string) => {
  modalApi.setProps({
    title: 'Changelog',
    cancelText: 'common.close',
    width: '90',
    height: '90',
    submit: false,
    maskClosable: true,
  })
  modalApi.setContent(PluginChangelog, { id }).open()
}

const handleUpdatePluginHub = async () => {
  try {
    await pluginsStore.updatePluginHub()
    message.success('plugins.updateSuccess')
  } catch (error: any) {
    console.error('handleUpdatePluginHub: ', error)
    message.error(error)
  }
}

const handleUpdatePlugins = async () => {
  try {
    await pluginsStore.updatePlugins()
    message.success('common.success')
  } catch (error: any) {
    console.error('handleUpdatePlugins: ', error)
    message.error(error)
  }
}

const handleUpdatePlugin = async (s: Plugin) => {
  try {
    await pluginsStore.updatePlugin(s.id)
    message.success('common.success')
  } catch (error: any) {
    console.error('handleUpdatePlugin: ', error)
    message.error(error)
  }
}

const handleDeletePlugin = async (p: Plugin) => {
  try {
    await pluginsStore.deletePlugin(p.id)
  } catch (error: any) {
    console.error('handleDeletePlugin: ', error)
    message.error(error)
  }
}

const handleDisablePlugin = async (p: Plugin) => {
  try {
    p.disabled = !p.disabled
    pluginsStore.editPlugin(p.id, p)
  } catch (error: any) {
    p.disabled = !p.disabled
    console.error('handleDisablePlugin: ', error)
    message.error(error)
  }
}

const handleEditPluginCode = (id: string, title: string) => {
  modalApi.setProps({ title, width: '90' })
  modalApi.setContent(PluginView, { id }).open()
}

const handleInstallation = async (p: Plugin) => {
  p.loading = true
  try {
    if (p.installed) {
      await pluginsStore.manualTrigger(p.id, PluginTriggerEvent.OnUninstall)
    } else {
      await pluginsStore.manualTrigger(p.id, PluginTriggerEvent.OnInstall)
    }
    p.installed = !p.installed
    await pluginsStore.editPlugin(p.id, p)
  } catch (error: any) {
    message.error(error)
  }
  p.loading = false
}

const handleOnRun = async (p: Plugin) => {
  p.running = true
  try {
    await pluginsStore.manualTrigger(p.id, PluginTriggerEvent.OnManual)
  } catch (error: any) {
    message.error(error)
  }
  p.running = false
}

const generateMenus = (p: Plugin) => {
  const builtInMenus: Menu[] = menuList.map((v) => ({ ...v, handler: () => v.handler?.(p.id) }))

  if (p.configuration.length) {
    builtInMenus.push({
      label: 'plugins.configuration',
      handler: async () => {
        modalApi.setProps({ title: 'plugins.configuration' })
        modalApi.setContent(PluginConfigurator, { plugin: p }).open()
      },
    })
  }

  if (Object.keys(p.menus).length !== 0) {
    builtInMenus.push({
      label: '',
      separator: true,
    })
  }

  const pluginMenus: Menu[] = Object.entries(p.menus).map(([title, fn]) => ({
    label: title,
    handler: async () => {
      try {
        p.running = true
        await pluginsStore.manualTrigger(p.id, fn as any)
      } catch (error: any) {
        message.error(error)
      } finally {
        p.running = false
      }
    },
  }))

  return builtInMenus.concat(...pluginMenus)
}

const noUpdateNeeded = computed(() => pluginsStore.plugins.every((v) => v.disabled))

const onSortUpdate = debounce(pluginsStore.savePlugins, 1000)
</script>

<template>
  <div v-if="pluginsStore.plugins.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="plugins.empty" tag="div" scope="global" class="flex items-center mt-12">
          <template #action>
            <Button type="link" @click="handleAddPlugin">{{ t('common.add') }}</Button>
          </template>
          <template #import>
            <Button type="link" @click="handleImportPlugin">{{ t('plugins.hub') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio v-model="appSettingsStore.app.pluginsView" :options="ViewOptions" class="mr-auto" />
    <Button type="link" @click="handleImportPlugin">
      {{ t('plugins.hub') }}
    </Button>
    <Dropdown>
      <template #default="{ close }">
        <Button
          :loading="pluginsStore.pluginHubLoading"
          type="link"
          @click="
            () => {
              handleUpdatePluginHub()
              close()
            }
          "
        >
          {{ t('plugins.checkForUpdates') }}
        </Button>
      </template>
      <template #overlay="{ close }">
        <div class="p-4 min-w-128">
          <Button
            :disabled="noUpdateNeeded"
            type="text"
            class="w-full"
            @click="
              () => {
                handleUpdatePlugins()
                close()
              }
            "
          >
            {{ t('common.updateAll') }}
          </Button>
        </div>
      </template>
    </Dropdown>
    <Button type="primary" icon="add" class="ml-16" @click="handleAddPlugin">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[pluginsStore.plugins, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="'grid-list-' + appSettingsStore.app.pluginsView"
  >
    <Card
      v-for="p in pluginsStore.plugins"
      :key="p.id"
      v-menu="generateMenus(p)"
      :title="p.name"
      :disabled="p.disabled"
      class="grid-list-item"
    >
      <template #title-prefix>
        <Tag v-if="pluginsStore.isDeprecated(p)" color="red"> {{ t('plugins.deprecated') }} </Tag>
        <Tag
          v-if="pluginsStore.hasNewPluginVersion(p)"
          size="small"
          color="cyan"
          class="cursor-pointer"
          @click="handleViewChangelog(p.id)"
        >
          {{ t('plugins.newVersion') }}
        </Tag>
        <div
          v-show="p.status !== 0"
          :style="{
            color: { 1: 'greenyellow', 2: 'red' }[p.status],
          }"
          class="pr-4"
        >
          ●
        </div>
        <Tag v-if="p.updating" color="cyan">
          {{ t('plugins.updating') }}
        </Tag>
      </template>

      <template #extra>
        <Dropdown v-if="appSettingsStore.app.pluginsView === View.Grid">
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <Button
                :loading="p.updating"
                :disabled="p.disabled"
                type="text"
                @click="handleUpdatePlugin(p)"
              >
                {{ t('common.update') }}
              </Button>
              <Button type="text" @click="handleDisablePlugin(p)">
                {{ p.disabled ? t('common.enable') : t('common.disable') }}
              </Button>
              <Button type="text" @click="handleEditPlugin(p.id)">
                {{ t('common.develop') }}
              </Button>
              <Button v-if="!p.install || !p.installed" type="text" @click="handleDeletePlugin(p)">
                {{ t('common.delete') }}
              </Button>
            </div>
          </template>
        </Dropdown>

        <template v-else>
          <Button
            :disabled="p.disabled"
            :loading="p.updating"
            type="text"
            size="small"
            @click="handleUpdatePlugin(p)"
          >
            {{ t('common.update') }}
          </Button>
          <Button type="text" size="small" @click="handleDisablePlugin(p)">
            {{ p.disabled ? t('common.enable') : t('common.disable') }}
          </Button>
          <Button type="text" size="small" @click="handleEditPlugin(p.id)">
            {{ t('common.develop') }}
          </Button>
          <Button
            :disabled="p.install && p.installed"
            type="text"
            size="small"
            @click="handleDeletePlugin(p)"
          >
            {{ t('common.delete') }}
          </Button>
        </template>
      </template>

      {{ t('plugin.trigger') }}:
      <Tag v-if="p.triggers.length === 0" size="small" color="red">{{ t('common.none') }}</Tag>

      <template v-if="appSettingsStore.app.pluginsView === View.Grid">
        <span v-for="trigger in p.triggers.slice(0, 2)" :key="trigger">
          <Tag size="small">{{ t('plugin.' + trigger) }}</Tag>
        </span>
        <Tag
          v-if="p.triggers.length > 2"
          v-tips="p.triggers.map((v) => t('plugin.' + v)).join('、')"
          size="small"
          color="cyan"
        >
          ...
        </Tag>
      </template>
      <template v-else>
        <span v-for="trigger in p.triggers" :key="trigger">
          <Tag size="small">{{ t('plugin.' + trigger) }}</Tag>
        </span>
      </template>

      <div
        v-tips="p.description"
        :class="{ 'line-clamp-1': appSettingsStore.app.pluginsView === View.Grid }"
      >
        {{ t('plugin.description') }}
        :
        {{ p.description || '--' }}
      </div>

      <div class="flex mt-4">
        <Button
          type="link"
          size="small"
          class="pl-4"
          style="margin-left: -8px"
          @click="handleEditPluginCode(p.id, p.name)"
        >
          {{ t('plugins.source') }}
        </Button>

        <Button
          v-if="p.install"
          :loading="p.loading"
          type="link"
          size="small"
          auto-size
          @click="handleInstallation(p)"
        >
          {{ t(p.installed ? 'common.uninstall' : 'common.install') }}
        </Button>

        <template v-if="p.triggers.includes(PluginTrigger.OnManual)">
          <Button
            v-if="!p.disabled && (!p.install || p.installed)"
            :loading="p.running"
            :icon="p.hasUI ? 'sparkle' : undefined"
            type="primary"
            size="small"
            auto-size
            class="ml-auto"
            @click="handleOnRun(p)"
          >
            {{ t('common.run') }}
          </Button>
        </template>
      </div>
    </Card>
  </div>

  <Modal />
</template>
