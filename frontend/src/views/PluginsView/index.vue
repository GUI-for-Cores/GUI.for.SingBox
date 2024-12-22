<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { useMessage, useConfirm } from '@/hooks'
import { debounce, ignoredError } from '@/utils'
import { Removefile, BrowserOpenURL } from '@/bridge'
import { DraggableOptions } from '@/constant/app'
import { PluginTriggerEvent, PluginTrigger, View } from '@/enums/app'
import { usePluginsStore, useAppSettingsStore, useEnvStore, type PluginType } from '@/stores'

import PluginForm from './components/PluginForm.vue'
import PluginView from './components/PluginView.vue'
import PluginHub from './components/PluginHub.vue'
import PluginConfiguration from './components/PluginConfiguration.vue'

const showPluginForm = ref(false)
const showPluginView = ref(false)
const showPluginHub = ref(false)
const showPluginConfiguration = ref(false)
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
        message.success('common.success')
      } catch (error: any) {
        console.log(error)
        message.error(error)
      }
    }
  },
  {
    label: 'common.openFile',
    handler: async (id: string) => {
      const plugin = pluginsStore.getPluginById(id)
      BrowserOpenURL(envStore.env.basePath + '/' + plugin!.path)
    }
  }
]

const { t } = useI18n()
const { message } = useMessage()
const { confirm } = useConfirm()

const envStore = useEnvStore()
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
    message.success('common.success')
  } catch (error: any) {
    console.error('handleUpdatePlugins: ', error)
    message.error(error)
  }
}

const handleUpdatePlugin = async (s: PluginType) => {
  try {
    await pluginsStore.updatePlugin(s.id)
  } catch (error: any) {
    console.error('handleUpdatePlugin: ', error)
    message.error(error)
  }
}

const handleDeletePlugin = async (p: PluginType) => {
  try {
    if (p.path.startsWith('data')) {
      await ignoredError(Removefile, p.path)
    }
    await pluginsStore.deletePlugin(p.id)

    // Remove configuration
    if (appSettingsStore.app.pluginSettings[p.id]) {
      if (await confirm('Tips', 'plugins.removeConfiguration').catch(() => 0)) {
        delete appSettingsStore.app.pluginSettings[p.id]
      }
    }
  } catch (error: any) {
    console.error('handleDeletePlugin: ', error)
    message.error(error)
  }
}

const handleDisablePlugin = async (p: PluginType) => {
  try {
    p.disabled = !p.disabled
    pluginsStore.editPlugin(p.id, p)
  } catch (error: any) {
    p.disabled = !p.disabled
    console.error('handleDisablePlugin: ', error)
    message.error(error)
  }
}

const handleEditPluginCode = (p: PluginType) => {
  pluginFormID.value = p.id
  pluginTitle.value = p.name
  showPluginView.value = true
}

const handleInstallation = async (p: PluginType) => {
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

const handleOnRun = async (p: PluginType) => {
  p.running = true
  try {
    await pluginsStore.manualTrigger(p.id, PluginTriggerEvent.OnManual)
  } catch (error: any) {
    message.error(error)
  }
  p.running = false
}

const generateMenus = (p: PluginType) => {
  const builtInMenus: Menu[] = menuList.map((v) => ({ ...v, handler: () => v.handler?.(p.id) }))

  if (p.configuration.length) {
    builtInMenus.push({
      label: 'plugins.configuration',
      handler: async () => {
        pluginFormID.value = p.id
        showPluginConfiguration.value = true
      }
    })
  }

  if (Object.keys(p.menus).length !== 0) {
    builtInMenus.push({
      label: '',
      separator: true
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
    }
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
        <I18nT keypath="plugins.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddPlugin" type="link">{{ t('common.add') }}</Button>
          </template>
          <template #import>
            <Button @click="handleImportPlugin" type="link">{{ t('plugins.hub') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio
      v-model="appSettingsStore.app.pluginsView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
    />
    <Button @click="handleImportPlugin" type="link" class="ml-auto">
      {{ t('plugins.hub') }}
    </Button>
    <Button
      @click="handleUpdatePlugins"
      :disabled="noUpdateNeeded"
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
    :class="'grid-list-' + appSettingsStore.app.pluginsView"
  >
    <Card
      v-for="p in pluginsStore.plugins"
      :key="p.id + p.key"
      :title="p.name"
      :disabled="p.disabled"
      v-menu="generateMenus(p)"
      class="item"
    >
      <template #title-prefix>
        <div
          v-show="p.status !== 0"
          :class="{ 0: '', 1: 'running', 2: 'stopped' }[p.status]"
          class="status"
        >
          ●
        </div>
        <Tag v-if="p.updating" color="cyan">
          {{ t('plugins.updating') }}
        </Tag>
      </template>

      <template #extra>
        <Dropdown
          v-if="appSettingsStore.app.pluginsView === View.Grid"
          :trigger="['hover', 'click']"
        >
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <Button
              v-if="!p.disabled"
              :loading="p.updating"
              type="link"
              size="small"
              @click="handleUpdatePlugin(p)"
            >
              {{ t('common.update') }}
            </Button>
            <Button type="link" size="small" @click="handleDisablePlugin(p)">
              {{ p.disabled ? t('common.enable') : t('common.disable') }}
            </Button>
            <Button type="link" size="small" @click="handleEditPlugin(p)">
              {{ t('common.develop') }}
            </Button>
            <Button
              v-if="!p.install || !p.installed"
              type="link"
              size="small"
              @click="handleDeletePlugin(p)"
            >
              {{ t('common.delete') }}
            </Button>
          </template>
        </Dropdown>

        <template v-else>
          <Button
            :disabled="p.disabled"
            :loading="p.updating"
            type="link"
            size="small"
            @click="handleUpdatePlugin(p)"
          >
            {{ t('common.update') }}
          </Button>
          <Button type="link" size="small" @click="handleDisablePlugin(p)">
            {{ p.disabled ? t('common.enable') : t('common.disable') }}
          </Button>
          <Button type="link" size="small" @click="handleEditPlugin(p)">
            {{ t('common.develop') }}
          </Button>
          <Button
            :disabled="p.install && p.installed"
            type="link"
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
        :class="{ description: appSettingsStore.app.pluginsView === View.Grid }"
      >
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
    max-height="90"
    :footer="false"
  >
    <PluginForm :is-update="pluginFormIsUpdate" :id="pluginFormID" />
  </Modal>

  <Modal
    v-model:open="showPluginView"
    :title="pluginTitle"
    :footer="false"
    min-width="70"
    max-height="90"
    width="90"
  >
    <PluginView :id="pluginFormID" />
  </Modal>

  <Modal
    v-model:open="showPluginHub"
    title="plugins.hub"
    :submit="false"
    mask-closable
    cancel-text="common.close"
    height="90"
    width="90"
  >
    <PluginHub />
  </Modal>

  <Modal
    v-model:open="showPluginConfiguration"
    title="plugins.configuration"
    :footer="false"
    max-height="80"
    max-width="80"
  >
    <PluginConfiguration :id="pluginFormID" />
  </Modal>
</template>

<style lang="less" scoped>
.description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action {
  display: flex;
  margin-top: 4px;
  .edit {
    margin-left: -4px;
    padding-left: 4px;
  }
}

.status {
  padding-right: 4px;
}

.running {
  color: greenyellow;
}

.stopped {
  color: red;
}
</style>
