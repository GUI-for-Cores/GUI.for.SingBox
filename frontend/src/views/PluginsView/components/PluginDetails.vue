<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { BrowserOpenURL } from '@/bridge'
import { usePluginsStore } from '@/stores'
import { deepClone, message } from '@/utils'

interface Props {
  plugin: App.Plugin
}

const props = defineProps<Props>()

const loading = ref(false)

const { t } = useI18n()
const pluginsStore = usePluginsStore()
const handleCancel = inject('cancel') as any

const installed = computed(() => pluginsStore.getPluginById(props.plugin.id))

const handleAddPlugin = async (plugin: App.Plugin) => {
  loading.value = true
  try {
    await pluginsStore.addPlugin(deepClone(plugin))
  } catch (err) {
    message.error(err)
  } finally {
    loading.value = false
  }
}

const handleUpdatePlugin = async (plugin: App.Plugin) => {
  try {
    await pluginsStore.updatePlugin(plugin.id)
  } catch (err) {
    message.error(err)
  }
}
</script>

<template>
  <div class="px-24 py-20">
    <div class="flex items-center gap-8">
      <div class="text-22 font-bold">{{ plugin.name }}</div>
      <Icon v-if="plugin.hasUI" v-tips="'plugin.hasUI'" icon="sparkle" :size="18" />
      <span class="profile-badge">{{ plugin.version }}</span>
      <span v-if="plugin.group" class="profile-badge">{{ plugin.group }}</span>
      <div class="flex items-center gap-8 ml-auto">
        <Button
          v-if="plugin.url"
          v-tips="plugin.url"
          type="text"
          icon="link"
          @click="BrowserOpenURL(plugin.url)"
        />
        <Button v-if="loading" loading type="primary" />
        <template v-else-if="installed">
          <Button
            v-if="pluginsStore.hasNewPluginVersion(installed)"
            :loading="installed.updating"
            type="primary"
            icon="refresh"
            @click="handleUpdatePlugin(plugin)"
          >
            {{ t('common.update') }}
          </Button>
          <Button v-else icon="selected">{{ t('common.added') }}</Button>
        </template>
        <Button v-else type="primary" icon="add" @click="handleAddPlugin(plugin)">
          {{ t('common.add') }}
        </Button>
        <Button icon="close" type="text" @click="handleCancel" />
      </div>
    </div>
    <div class="profile-muted text-12 mt-4">@{{ plugin.id }}</div>
    <div class="text-14 mt-12 whitespace-pre-wrap break-all">{{ plugin.description }}</div>

    <template v-if="plugin.triggers.length">
      <div class="profile-title">{{ t('plugin.trigger') }}</div>
      <div class="flex flex-wrap gap-8">
        <span v-for="trigger in plugin.triggers" :key="trigger" class="profile-chip">
          {{ t('plugin.' + trigger) }}
        </span>
      </div>
    </template>

    <template v-if="Object.keys(plugin.menus || {}).length">
      <div class="profile-title">{{ t('plugin.menus') }}</div>
      <div class="flex flex-wrap gap-8">
        <span v-for="(fn, menu) in plugin.menus" :key="menu" class="profile-chip">
          {{ menu }} ({{ fn }})
        </span>
      </div>
    </template>

    <template v-if="plugin.configuration?.length">
      <div class="profile-title">{{ t('plugin.configuration') }}</div>
      <div class="grid grid-cols-2 gap-8">
        <div v-for="conf in plugin.configuration" :key="conf.id" class="profile-card rounded-8">
          <div class="text-12 font-bold line-clamp-1">{{ conf.title }}</div>
          <div class="profile-muted text-12 mt-4 line-clamp-2">
            {{ conf.description || conf.key }}
          </div>
        </div>
      </div>
    </template>

    <template v-if="plugin.tags?.length">
      <div class="profile-title">{{ t('plugin.tags') }}</div>
      <div class="flex flex-wrap gap-8">
        <span v-for="tag in plugin.tags" :key="tag" class="profile-chip"># {{ tag }}</span>
      </div>
    </template>
  </div>
</template>

<style lang="less" scoped>
.profile-muted {
  opacity: 0.6;
}

.profile-badge {
  font-size: 12px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent);
  background: color-mix(in srgb, var(--primary-color) 15%, transparent);
}

.profile-title {
  font-size: 14px;
  font-weight: bold;
  margin: 20px 0 8px;
}

.profile-chip {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--card-bg);
  border: 1px solid var(--divider-color);
}

.profile-card {
  padding: 8px 12px;
  background: var(--card-bg);
  border: 1px solid var(--divider-color);
}
</style>
