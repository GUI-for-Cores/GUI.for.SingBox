<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePluginsStore } from '@/stores'
import { createTextMatcher, deepClone, message, modal } from '@/utils'

import PluginSource from './PluginSource.vue'

const keywords = ref('')

const { t } = useI18n()
const pluginsStore = usePluginsStore()
const loadingSet = ref(new Set<string>())

const groupOrders = ['Recommended', 'Extensions', 'Tools', 'Fun', 'Examples', 'Development']

const groups = computed(() => {
  const map: Record<string, App.Plugin[]> = {}
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

const handleAddPlugin = async (plugin: App.Plugin) => {
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

const toggleSettingsModal = () => {
  const m = modal({
    title: 'plugins.sourceConfig.name',
    submit: false,
    width: '60',
    cancelText: 'common.close',
  })
  m.setContent(PluginSource).open()
}

const isAlreadyAdded = (id: string) => pluginsStore.getPluginById(id)

if (pluginsStore.pluginHub.length === 0) {
  pluginsStore.updatePluginHub()
}
</script>

<template>
  <ModalContainer :empty="filteredPlugins.length == 0">
    <template #top>
      <Input
        v-model="keywords"
        :border="false"
        :placeholder="t('plugins.total') + ': ' + pluginsStore.pluginHub.length"
        clearable
        class="w-full"
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
          <Button
            v-tips="'plugins.sourceConfig.name'"
            icon="settings3"
            type="text"
            @click="toggleSettingsModal"
          />
        </template>
      </Input>
    </template>

    <template #empty>
      <Empty>
        <template #description>
          <Button
            icon="refresh"
            :loading="pluginsStore.pluginHubLoading"
            type="primary"
            size="small"
            @click="handleUpdatePluginHub"
          >
            {{ $t('plugins.update') }}
          </Button>
        </template>
      </Empty>
    </template>

    <template #body>
      <div v-for="group in filteredPlugins" :key="group.name">
        <div class="text-16 font-bold px-4 py-12 sticky top-0 z-9">{{ group.name }}</div>

        <div class="grid grid-cols-2 gap-8">
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
                <Button
                  v-else
                  type="text"
                  icon="add"
                  size="small"
                  @click="handleAddPlugin(plugin)"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </ModalContainer>
</template>
