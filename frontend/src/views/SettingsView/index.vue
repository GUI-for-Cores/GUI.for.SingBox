<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores'

import GeneralSettings from './components/GeneralSettings.vue'
import CoreSettings from './components/CoreSettings.vue'
import PluginSettings from './components/PluginSettings.vue'

const settings = [
  {
    key: 'general',
    tab: 'settings.general',
    component: GeneralSettings,
  },
  {
    key: 'kernel',
    tab: 'router.kernel',
    component: CoreSettings,
  },
  {
    key: 'plugins',
    tab: 'router.plugins',
    component: PluginSettings,
  },
] as const

const activeKey = ref(settings[0].key)

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
    <template #extra>
      <Button type="text" @click="appStore.showAbout = true">
        {{ t('router.about') }}
      </Button>
    </template>
  </Tabs>
</template>
