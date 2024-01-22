<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { debounce } from '@/utils'
import { useMessage } from '@/hooks'
import { DraggableOptions, PluginManualEvent, PluginTrigger, View } from '@/constant'
import { usePluginsStore, useAppSettingsStore, type PluginType, type Menu } from '@/stores'

import PluginForm from './components/PluginForm.vue'
import PluginView from './components/PluginView.vue'
import PluginHub from './components/PluginHub.vue'

const showPluginForm = ref(false)
const showPluginView = ref(false)
const showPluginHub = ref(false)
const pluginTitle = ref('')
const pluginFormID = ref()
const pluginFormIsUpdate = ref(false)
const pluginFormTitle = computed(() => (pluginFormIsUpdate.value ? 'common.edit' : 'common.add'))

const menuList: Menu[] = [
  {
    label: 'plugins.reload',
    handler: async (id: string) => {
      const plugin = pluginsStore.getPluginById(id)
      try {
        await pluginsStore.reloadPlugin(plugin!)
        message.info('common.success')
      } catch (error: any) {
        console.log(error)
        message.info(error)
      }
    }
  }
]

const { t } = useI18n()
const { message } = useMessage()

const pluginsStore = usePluginsStore()
const appSettingsStore = useAppSettingsStore()

const handleImportPlugin = async () => {
  showPluginHub.value = true
}

const handleAddPlugin = async () => {
  pluginFormIsUpdate.value = false
  showPluginForm.value = true
}

const handleEditPlugin = (p: PluginType) => {
  pluginFormIsUpdate.value = true
  pluginFormID.value = p.id
  showPluginForm.value = true
}

const handleUpdatePlugins = async () => {
  try {
    await pluginsStore.updatePlugins()
    message.info('common.success')
  } catch (error: any) {
    console.error('handleUpdatePlugins: ', error)
    message.info(error)
  }
}

const handleUpdatePlugin = async (s: PluginType) => {
  try {
    await pluginsStore.updatePlugin(s.id)
    message.info('common.success')
  } catch (error: any) {
    console.error('handleUpdatePlugin: ', error)
    message.info(error)
  }
}

const handleDeletePlugin = async (p: PluginType) => {
  try {
    await pluginsStore.deletePlugin(p.id)
    message.info('common.success')
  } catch (error: any) {
    console.error('handleDeletePlugin: ', error)
    message.info(error)
  }
}

const handleDisablePlugin = async (p: PluginType) => {
  try {
    p.disabled = !p.disabled
    pluginsStore.editPlugin(p.id, p)
    message.info('common.success')
  } catch (error: any) {
    p.disabled = !p.disabled
    console.error('handleDisablePlugin: ', error)
    message.info(error)
  }
}

const handleEditPluginCode = (p: PluginType) => {
  pluginFormID.value = p.id
  pluginTitle.value = p.name
  showPluginView.value = true
}

const handleInstallation = async (p: PluginType) => {
  try {
    p.loading = true
    if (p.installed) {
      await pluginsStore.manualTrigger(p, PluginManualEvent.OnUninstall)
    } else {
      await pluginsStore.manualTrigger(p, PluginManualEvent.OnInstall)
    }
    p.installed = !p.installed
    await pluginsStore.editPlugin(p.id, p)
    message.info('common.success')
  } catch (error: any) {
    message.info(p.name + ': ' + error)
  }
  p.loading = false
}

const handleOnRun = async (p: PluginType) => {
  try {
    await pluginsStore.manualTrigger(p, PluginManualEvent.OnRun)
  } catch (error: any) {
    message.info(p.name + ': ' + error)
  }
}

const noUpdateNeeded = computed(() => pluginsStore.plugins.every((v) => v.disabled))

const onSortUpdate = debounce(pluginsStore.savePlugins, 1000)
</script>

<template>
  <div v-if="pluginsStore.plugins.length === 0" class="empty">
    <Empty>
      <template #description>
        <I18nT keypath="plugins.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddPlugin" type="link">{{ t('common.add') }}</Button>
          </template>
          <template #import>
            <Button @click="handleImportPlugin" type="link">{{ t('common.import') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="header">
    <Radio
      v-model="appSettingsStore.app.pluginsView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
    />
    <Button class="ml-auto" @click="handleImportPlugin" type="link">
      {{ t('plugins.hub') }}
    </Button>
    <Button
      @click="handleUpdatePlugins"
      :disable="noUpdateNeeded"
      :type="noUpdateNeeded ? 'text' : 'link'"
    >
      {{ t('common.updateAll') }}
    </Button>
    <Button @click="handleAddPlugin" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[pluginsStore.plugins, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="appSettingsStore.app.pluginsView"
    class="plugins"
  >
    <Card
      v-for="p in pluginsStore.plugins"
      :key="p.id"
      :title="p.name"
      :disabled="p.disabled"
      v-menu="menuList.map((v) => ({ ...v, handler: () => v.handler?.(p.id) }))"
      class="plugin"
    >
      <template #title-prefix>
        <Tag v-if="p.updating" color="cyan">
          {{ t('plugins.updating') }}
        </Tag>
      </template>

      <template #extra>
        <Dropdown
          v-if="appSettingsStore.app.pluginsView === View.Grid"
          :trigger="['hover', 'click']"
        >
          <Button type="link" size="small">
            {{ t('common.more') }}
          </Button>
          <template #overlay>
            <Button
              :disable="p.disabled"
              :loading="p.updating"
              :type="p.disabled ? 'text' : 'link'"
              size="small"
              @click="handleUpdatePlugin(p)"
            >
              {{ t('common.update') }}
            </Button>
            <Button type="link" size="small" @click="handleDisablePlugin(p)">
              {{ p.disabled ? t('common.enable') : t('common.disable') }}
            </Button>
            <Button type="link" size="small" @click="handleEditPlugin(p)">
              {{ t('common.edit') }}
            </Button>
            <Button type="link" size="small" @click="handleDeletePlugin(p)">
              {{ t('common.delete') }}
            </Button>
          </template>
        </Dropdown>

        <template v-else>
          <Button
            :disable="p.disabled"
            :loading="p.updating"
            :type="p.disabled ? 'text' : 'link'"
            size="small"
            @click="handleUpdatePlugin(p)"
          >
            {{ t('common.update') }}
          </Button>
          <Button type="link" size="small" @click="handleDisablePlugin(p)">
            {{ p.disabled ? t('common.enable') : t('common.disable') }}
          </Button>
          <Button type="link" size="small" @click="handleEditPlugin(p)">
            {{ t('common.edit') }}
          </Button>
          <Button type="link" size="small" @click="handleDeletePlugin(p)">
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

      <div :class="{ description: appSettingsStore.app.pluginsView === View.Grid }">
        {{ t('plugin.description') }}
        :
        {{ p.description || '--' }}
      </div>

      <div class="action">
        <Button @click="handleEditPluginCode(p)" type="link" size="small" class="edit">
          {{ t('plugins.source') }}
        </Button>

        <Button
          v-if="p.install"
          @click="handleInstallation(p)"
          :loading="p.loading"
          type="link"
          size="small"
          auto-size
        >
          {{ t(p.installed ? 'common.uninstall' : 'common.install') }}
        </Button>

        <template v-if="p.triggers.includes(PluginTrigger.OnManual)">
          <Button
            v-if="!p.disabled && (!p.install || p.installed)"
            @click="handleOnRun(p)"
            :loading="p.running"
            type="primary"
            size="small"
            auto-size
            class="ml-auto"
          >
            {{ t('common.run') }}
          </Button>
        </template>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showPluginForm"
    :title="pluginFormTitle"
    min-width="66"
    max-height="80"
    :footer="false"
  >
    <PluginForm :is-update="pluginFormIsUpdate" :id="pluginFormID" />
  </Modal>

  <Modal
    v-model:open="showPluginView"
    :title="pluginTitle"
    :footer="false"
    max-height="80"
    width="80"
  >
    <PluginView :id="pluginFormID" />
  </Modal>

  <Modal
    v-model:open="showPluginHub"
    title="plugins.hub"
    :submit="false"
    cancel-text="common.close"
    height="90"
    width="90"
  >
    <PluginHub />
  </Modal>
</template>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 9;
}

.empty {
  text-align: center;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plugins {
  flex: 1;
  margin-top: 8px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;

  .description {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.grid {
  .plugin {
    display: inline-block;
    width: calc(33.333333% - 16px);
    margin: 8px;
  }
}
.list {
  .plugin {
    margin: 8px;
  }
}
.action {
  display: flex;
  margin-top: 4px;
  .edit {
    margin-left: -4px;
    padding-left: 4px;
  }
}
.ml-auto {
  margin-left: auto;
}
</style>
