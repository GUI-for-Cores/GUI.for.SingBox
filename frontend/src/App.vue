<script setup lang="ts">
import { ref } from 'vue'

import { EventsOn } from '@/utils/bridge'
import { ignoredError, sleep } from '@/utils'
import { useMessage } from '@/hooks'
import {
  useAppSettingsStore,
  useProfilesStore,
  useSubscribesStore,
  useRulesetsStore,
  usePluginsStore,
  useEnvStore,
  useAppStore
} from '@/stores'

import SplashView from '@/views/SplashView.vue'
import { NavigationBar, MainPage, TitleBar } from '@/components'

const loading = ref(true)

const appStore = useAppStore()
const appSettings = useAppSettingsStore()
const profilesStore = useProfilesStore()
const subscribesStore = useSubscribesStore()
const rulesetsStore = useRulesetsStore()
const pluginsStore = usePluginsStore()
const envStore = useEnvStore()

const { message } = useMessage()
window.Plugins.message = message

appSettings.setupAppSettings().then(async () => {
  EventsOn('onTrayReady', async () => {
    appStore.setupTrayMenus()
  })

  await Promise.all([
    ignoredError(envStore.setupEnv),
    ignoredError(profilesStore.setupProfiles),
    ignoredError(subscribesStore.setupSubscribes),
    ignoredError(rulesetsStore.setupRulesets),
    ignoredError(pluginsStore.setupPlugins)
  ])

  await sleep(1000)
  loading.value = false

  pluginsStore.onStartupTrigger()
})
</script>

<template>
  <SplashView v-if="loading" />
  <template v-else>
    <TitleBar />
    <div class="main">
      <NavigationBar />
      <MainPage />
    </div>
  </template>

  <Menu
    v-model="appStore.menuShow"
    :position="appStore.menuPosition"
    :menu-list="appStore.menuList"
  />

  <Tips
    v-model="appStore.tipsShow"
    :position="appStore.tipsPosition"
    :message="appStore.tipsMessage"
  />
</template>

<style scoped>
.main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px;
}
</style>
