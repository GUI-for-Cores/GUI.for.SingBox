<script setup lang="ts">
import { ref } from 'vue'

import { ignoredError, sleep } from '@/utils'
import {
  useAppSettingsStore,
  useProfilesStore,
  useSubscribesStore,
  useRulesetsStore,
  useKernelApiStore,
  useEnvStore,
  useApp
} from '@/stores'

import SplashView from '@/views/SplashView.vue'
import { NavigationBar, MainPage, TitleBar } from '@/components'

const loading = ref(true)

const appStore = useApp()
const appSettings = useAppSettingsStore()
const profilesStore = useProfilesStore()
const subscribesStore = useSubscribesStore()
const rulesetsStore = useRulesetsStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()

appSettings.setupAppSettings().then(async () => {
  await ignoredError(envStore.setupEnv)
  await ignoredError(profilesStore.setupProfiles)
  await ignoredError(subscribesStore.setupSubscribes)
  await ignoredError(rulesetsStore.setupRulesets)
  await ignoredError(kernelApiStore.setupKernelApi)
  await sleep(1000)
  loading.value = false
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
