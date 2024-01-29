<script setup lang="ts">
import { ref } from 'vue'

import * as Stores from '@/stores'
import { useMessage } from '@/hooks'
import { EventsOn } from '@/utils/bridge'
import { ignoredError, sampleID, sleep } from '@/utils'


import SplashView from '@/views/SplashView.vue'
import { NavigationBar, MainPage, TitleBar } from '@/components'

const loading = ref(true)

const envStore = Stores.useEnvStore()
const appStore = Stores.useAppStore()
const pluginsStore = Stores.usePluginsStore()
const profilesStore = Stores.useProfilesStore()
const rulesetsStore = Stores.useRulesetsStore()
const appSettings = Stores.useAppSettingsStore()
const kernelApiStore = Stores.useKernelApiStore()
const subscribesStore = Stores.useSubscribesStore()

const { message } = useMessage()
window.Plugins.message = message

EventsOn('launchArgs', async (args: string[]) => {
  console.log('launchArgs', args)
  const url = new URL(args[0])
  if (url.pathname.startsWith('//import-remote-profile')) {
    const _url = url.searchParams.get('url')
    const _name = decodeURIComponent(url.hash).slice(1) || sampleID()

    if (!_url) {
      message.info('URL missing')
      return
    }

    try {
      await subscribesStore.importSubscribe(_name, _url)
      message.info('common.success')
    } catch (error: any) {
      message.info('URL missing')
    }
  }
})

appSettings.setupAppSettings().then(async () => {
  await Promise.all([
    ignoredError(envStore.setupEnv),
    ignoredError(profilesStore.setupProfiles),
    ignoredError(subscribesStore.setupSubscribes),
    ignoredError(rulesetsStore.setupRulesets),
    ignoredError(pluginsStore.setupPlugins)
  ])

  kernelApiStore.updateKernelStatus().then(async (running) => {
    kernelApiStore.statusLoading = false
    if (running) {
      await kernelApiStore.refreshConfig()
      await envStore.updateSystemProxyState()
    } else if (appSettings.app.autoStartKernel) {
      await kernelApiStore.startKernel()
    }

    appStore.updateTrayMenus()
  })

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
