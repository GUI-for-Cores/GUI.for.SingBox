<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores'

import CoreSettings from './components/CoreSettings.vue'
import GeneralSettings from './components/GeneralSettings.vue'
import PluginSettings from './components/PluginSettings.vue'

const settings = [
  { key: 'general', tab: 'settings.general' },
  { key: 'kernel', tab: 'router.kernel' },
  { key: 'plugins', tab: 'router.plugins' },
] as const

const activeKey = ref<(typeof settings)[number]['key']>('general')

const { t } = useI18n()
const appStore = useAppStore()
</script>

<template>
  <Tabs
    v-model:active-key="activeKey"
    :items="settings"
    tab-width="15%"
    content-width="85%"
    class="h-full"
  >
    <template #general>
      <GeneralSettings />
    </template>

    <template #plugins>
      <PluginSettings />
    </template>

    <template #kernel>
      <CoreSettings />
    </template>

    <template #extra>
      <Button type="text" @click="appStore.showAbout = true">
        {{ t('router.about') }}
      </Button>
    </template>
  </Tabs>
</template>
