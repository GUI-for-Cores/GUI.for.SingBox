<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'
import { usePluginsStore } from '@/stores'
import { deepClone, message, sleep } from '@/utils'

import type { Plugin } from '@/types/app'
const keywords = ref('')

const { t } = useI18n()
const pluginsStore = usePluginsStore()

const [tagsVisible, toggleTagsVisible] = useBool(false)
const tags = ref<Set<string>>(new Set())

const allTags = computed(() => {
  const tagCountMap = new Map()

  for (const plugin of pluginsStore.pluginHub) {
    for (const tag of plugin.tags) {
      tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1)
    }
  }

  return Array.from(tagCountMap, ([name, count]) => ({ name, count }))
})

const onTagClose = (tag: string) => tags.value.delete(tag)

const toggleChecked = (tag: string) => {
  tags.value.has(tag) ? tags.value.delete(tag) : tags.value.add(tag)
}

const filteredPlugins = computed(() => {
  const allPlugins = pluginsStore.pluginHub
  const keyword = keywords.value.trim()
  const selectedTags = tags.value

  if (!keyword && selectedTags.size === 0) return allPlugins

  return allPlugins.filter((plugin) => {
    const matchesKeyword =
      !keyword || (plugin.name + plugin.id + plugin.description).includes(keyword)

    const matchesTags =
      selectedTags.size === 0 || Array.from(selectedTags).every((tag) => plugin.tags.includes(tag))

    return matchesKeyword && matchesTags
  })
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
      <div class="flex items-center gap-8">
        <Button
          @click="toggleTagsVisible"
          icon="settings3"
          size="small"
          :icon-color="tagsVisible ? 'var(--primary-color)' : ''"
        />
        <Input
          v-model="keywords"
          :border="false"
          :placeholder="t('plugins.total') + ': ' + pluginsStore.pluginHub.length"
          clearable
          size="small"
          class="flex-1"
        >
          <template #extra>
            <Tag
              v-for="tag in tags"
              :key="tag"
              @close="onTagClose(tag)"
              @click="onTagClose(tag)"
              color="cyan"
              size="small"
              closeable
            >
              {{ tag }}
            </Tag>
          </template>
        </Input>
        <Button @click="handleUpdatePluginHub" icon="refresh" size="small">
          {{ t('plugins.update') }}
        </Button>
      </div>
      <div v-if="tagsVisible" class="flex flex-wrap gap-2 mt-8">
        <Tag
          v-for="tag in allTags"
          @click="toggleChecked(tag.name)"
          :color="tags.has(tag.name) ? 'primary' : 'default'"
          :key="tag.name"
          class="cursor-pointer"
        >
          {{ `${tag.name}(${tag.count})` }}
        </Tag>
      </div>

      <Empty v-if="filteredPlugins.length === 0" />

      <div class="overflow-y-auto grid grid-cols-3 text-12 gap-8 mt-8 pb-16 pr-8">
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
