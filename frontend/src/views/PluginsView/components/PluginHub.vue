<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePluginsStore } from '@/stores'
import { deepClone, message, sleep } from '@/utils'

import type { Plugin } from '@/types/app'
const keywords = ref('')

const { t } = useI18n()
const pluginsStore = usePluginsStore()

const filteredPlugins = computed(() => {
  if (!keywords.value) return pluginsStore.pluginHub
  return pluginsStore.pluginHub.filter((v) => (v.name + v.description).includes(keywords.value))
})

const handleAddPlugin = async (plugin: Plugin) => {
  const { success, error, destroy } = message.info('plugins.updating', 60 * 1000)
  try {
    await pluginsStore.addPlugin(deepClone(plugin))
    success('common.success')
  } catch (err: any) {
    error(err.message || err)
  } finally {
    sleep(1000).then(destroy)
  }
}

const handleUpdatePluginHub = async () => {
  try {
    await pluginsStore.updatePluginHub()
    message.success('plugins.updateSuccess')
  } catch (err: any) {
    message.error(err.message || err)
  }
}

const isAlreadyAdded = (id: string) => pluginsStore.getPluginById(id)

if (pluginsStore.pluginHub.length === 0) {
  pluginsStore.updatePluginHub()
}
</script>

<template>
  <div class="h-full">
    <div v-if="pluginsStore.pluginHubLoading" class="flex items-center justify-center h-full">
      <Button type="text" loading />
    </div>
    <div v-else class="flex flex-col h-full">
      <div class="flex items-center">
        <Input
          v-model="keywords"
          :border="false"
          :placeholder="t('plugins.total') + ': ' + pluginsStore.pluginHub.length"
          clearable
          size="small"
          class="flex-1"
        />
        <Button @click="handleUpdatePluginHub" icon="refresh" size="small" class="ml-8">
          {{ t('plugins.update') }}
        </Button>
      </div>
      <div class="overflow-y-auto grid grid-cols-3 text-12 gap-8 mt-8">
        <Card v-for="plugin in filteredPlugins" :key="plugin.id" :title="plugin.name">
          <div class="flex flex-col h-full">
            <div v-tips="plugin.description" class="flex-1 line-clamp-2">
              {{ plugin.description }}
            </div>
            <div class="flex items-center justify-end">
              <Button v-if="isAlreadyAdded(plugin.id)" type="text" size="small">
                {{ t('common.added') }}
              </Button>
              <Button v-else @click="handleAddPlugin(plugin)" type="link" size="small">
                {{ t('common.add') }}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
