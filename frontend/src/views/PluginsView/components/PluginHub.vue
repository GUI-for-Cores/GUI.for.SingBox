<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePluginsStore } from '@/stores'
import { APP_TITLE, createTextMatcher, deepClone, message } from '@/utils'

import type { Plugin } from '@/types/app'

const keywords = ref('')

const { t } = useI18n()
const pluginsStore = usePluginsStore()
const loadingSet = ref(new Set<string>())

const groupOrders = ['Recommended', 'Extensions', 'Tools', 'Fun', 'Examples', 'Development']

const groups = computed(() => {
  const map: Record<string, Plugin[]> = {}
  pluginsStore.pluginHub.forEach((plugin) => {
    const group = plugin.group || 'Others'
    if (!map[group]) {
      map[group] = []
    }
    map[group].push(plugin)
  })
  return Object.keys(map)
    .map((name) => ({
      name,
      plugins: map[name]!,
    }))
    .sort((a, b) => {
      const indexA = groupOrders.indexOf(a.name)
      const indexB = groupOrders.indexOf(b.name)
      if (indexA === -1 && indexB === -1) {
        return a.name.localeCompare(b.name)
      }
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
})

const filteredPlugins = computed(() => {
  const keyword = keywords.value.trim()
  if (!keyword) return groups.value
  const match = createTextMatcher(keyword.toLocaleLowerCase(), '')
  return groups.value
    .map((group) => ({
      name: group.name,
      plugins: group.plugins.filter((plugin) =>
        match([plugin.id, plugin.name, plugin.description].join('').toLocaleLowerCase()),
      ),
    }))
    .filter((group) => group.plugins.length)
})

const handleAddPlugin = async (plugin: Plugin) => {
  loadingSet.value.add(plugin.id)
  try {
    await pluginsStore.addPlugin(deepClone(plugin))
  } catch (err: any) {
    message.error(err.message || err)
  } finally {
    loadingSet.value.delete(plugin.id)
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
  <div class="pr-8">
    <div class="text-22 text-center pb-12">{{ t('plugins.slogan', [APP_TITLE]) }}</div>
    <div class="flex items-center gap-8 sticky top-0 z-2 mb-12">
      <Input
        v-model="keywords"
        :border="false"
        :placeholder="t('plugins.total') + ': ' + pluginsStore.pluginHub.length"
        clearable
        class="flex-1"
      >
        <template #prefix>
          <Icon icon="search" :size="22" />
        </template>
        <template #suffix>
          <Button
            v-tips="'plugins.update'"
            icon="refresh"
            :loading="pluginsStore.pluginHubLoading"
            type="text"
            @click="handleUpdatePluginHub"
          />
        </template>
      </Input>
    </div>

    <div v-if="filteredPlugins.length == 0" class="flex items-center justify-center h-256">
      <Empty />
    </div>

    <div v-for="group in filteredPlugins" :key="group.name">
      <div class="text-16 font-bold mt-20 px-4">{{ group.name }}</div>

      <div class="grid grid-cols-2 gap-8 py-8">
        <Card v-for="plugin in group.plugins" :key="plugin.id">
          <template #title-prefix>
            <div class="text-14 font-bold">{{ plugin.name }}</div>
          </template>
          <div class="flex items-center">
            <div v-tips="plugin.description" class="flex-1 line-clamp-1 h-full text-10">
              {{ plugin.description }}
            </div>
            <Button v-if="loadingSet.has(plugin.id)" loading type="text" size="small" />
            <div v-else class="flex items-center">
              <Button v-if="isAlreadyAdded(plugin.id)" icon="selected" type="text" size="small" />
              <Button v-else type="text" icon="add" size="small" @click="handleAddPlugin(plugin)" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
