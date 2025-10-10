<script lang="ts" setup>
import { computed } from 'vue'

import { useAppSettingsStore, usePluginsStore } from '@/stores'
import { message } from '@/utils'

import type { Plugin } from '@/types/app'

const pluginsStore = usePluginsStore()
const appSettingsStore = useAppSettingsStore()

const plugins = computed(() =>
  pluginsStore.plugins.filter((plugin) => plugin.configuration.length > 0),
)

const getOptions = (val: string[]) => {
  return val.map((v) => {
    const arr = v.split(',')
    return { label: arr[0], value: arr[1] || arr[0] }
  })
}

const onChange = (id: string, key: string, value: any) => {
  if (!appSettingsStore.app.pluginSettings[id]) {
    appSettingsStore.app.pluginSettings[id] = {}
  }
  appSettingsStore.app.pluginSettings[id][key] = value
}

const handleReset = (plugin: Plugin, key: string) => {
  delete appSettingsStore.app.pluginSettings[plugin.id]?.[key]
}

const handleResetAll = (plugin: Plugin) => {
  delete appSettingsStore.app.pluginSettings[plugin.id]
  message.success('common.success')
}
</script>

<template>
  <div class="flex flex-col gap-8 pr-8">
    <template v-if="plugins.length === 0">
      <div class="text-18 font-bold pb-12">
        {{ $t('plugins.configuration') }}
      </div>
      <Card>
        <div class="py-32"><Empty /></div>
      </Card>
    </template>
    <div v-for="plugin in plugins" :key="plugin.id">
      <div class="flex items-center pb-12">
        <Dropdown>
          <Button icon="settings" type="text"></Button>
          <template #overlay="{ close }">
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <Button
                @click="
                  () => {
                    handleResetAll(plugin)
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
        <div class="text-18 font-bold">
          {{ plugin.name }}
        </div>
      </div>
      <Card
        v-for="(conf, index) in plugin.configuration"
        :key="conf.id"
        :title="`${index + 1}. ${conf.title}`"
        :class="{ warn: appSettingsStore.app.pluginSettings[plugin.id]?.[conf.key] !== undefined }"
        class="card mb-8"
      >
        <template
          v-if="appSettingsStore.app.pluginSettings[plugin.id]?.[conf.key] !== undefined"
          #title-prefix
        >
          <Dropdown>
            <Button icon="settings3" size="small" :icon-size="12" type="text" />
            <template #overlay>
              <div class="flex flex-col gap-4 min-w-64 p-4">
                <Button @click="handleReset(plugin, conf.key)" type="text" size="small">
                  {{ $t('settings.plugin.resetSetting') }}
                </Button>
              </div>
            </template>
          </Dropdown>
        </template>
        <div class="mb-8 text-12">{{ conf.description }}</div>
        <Component
          :modelValue="appSettingsStore.app.pluginSettings[plugin.id]?.[conf.key] ?? conf.value"
          @change="(val: any) => onChange(plugin.id, conf.key, val)"
          :is="conf.component"
          :options="getOptions(conf.options)"
          :autofocus="false"
          editable
          lang="yaml"
        />
      </Card>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-left: 2px solid transparent;
}
.warn {
  border-left: 2px solid var(--primary-color);
}
</style>
