<script lang="ts" setup>
import { computed } from 'vue'

import { useAppSettingsStore, usePluginsStore } from '@/stores'

import PluginConfigItem from './components/PluginConfigItem.vue'

const appSettingsStore = useAppSettingsStore()
const pluginsStore = usePluginsStore()

const plugins = computed(() =>
  pluginsStore.plugins.filter((plugin) => plugin.configuration.length > 0),
)
</script>

<template>
  <div class="flex flex-col pr-8">
    <template v-if="plugins.length === 0">
      <div class="text-18 font-bold pb-12">
        {{ $t('plugins.configuration') }}
      </div>
      <Card>
        <div class="py-32"><Empty /></div>
      </Card>
    </template>

    <PluginConfigItem
      v-for="plugin in plugins"
      :key="plugin.id"
      :plugin="plugin"
      :model-value="appSettingsStore.app.pluginSettings[plugin.id]"
      @change="
        (val: Recordable) => {
          if (JSON.stringify(val) === '{}') {
            delete appSettingsStore.app.pluginSettings[plugin.id]
          } else {
            appSettingsStore.app.pluginSettings[plugin.id] = val
          }
        }
      "
    >
      <template #header="{ handleResetAll }">
        <div class="flex items-center pb-12">
          <Dropdown>
            <Button icon="settings" type="text"></Button>
            <template #overlay="{ close }">
              <div class="flex flex-col gap-4 min-w-64 p-4">
                <Button
                  @click="
                    () => {
                      handleResetAll()
                      close()
                    }
                  "
                  type="text"
                  size="small"
                >
                  {{ $t('settings.plugin.resetSettings') }}
                </Button>
              </div>
            </template>
          </Dropdown>
          <div class="text-18 font-bold">{{ plugin.name }}</div>
        </div>
      </template>
    </PluginConfigItem>
  </div>
</template>
