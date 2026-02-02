<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores'

const settings = [
  {
    key: 'general',
    tab: 'settings.general',
    component: defineAsyncComponent(() => import('./components/GeneralSettings.vue')),
  },
  {
    key: 'kernel',
    tab: 'router.kernel',
    component: defineAsyncComponent(() => import('./components/CoreSettings.vue')),
  },
  {
    key: 'plugins',
    tab: 'router.plugins',
    component: defineAsyncComponent(() => import('./components/PluginSettings.vue')),
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
