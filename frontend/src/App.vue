<script setup lang="ts">
import { ref } from 'vue'

import * as Stores from '@/stores'
import { exitApp, sampleID, sleep } from '@/utils'
import { EventsOn, WindowHide, IsStartup } from '@/bridge'
import { useMessage, usePicker, useConfirm, usePrompt, useAlert } from '@/hooks'

import AboutView from '@/views/AboutView.vue'
import SplashView from '@/views/SplashView.vue'
import CommandView from './views/CommandView.vue'
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
const scheduledTasksStore = Stores.useScheduledTasksStore()

const { message } = useMessage()
const { picker } = usePicker()
const { confirm } = useConfirm()
const { prompt } = usePrompt()
const { alert } = useAlert()

window.Plugins.message = message
window.Plugins.picker = picker
window.Plugins.confirm = confirm
window.Plugins.prompt = prompt
window.Plugins.alert = alert

EventsOn('launchArgs', async (args: string[]) => {
  const url = new URL(args[0])
  if (url.pathname.startsWith('//import-remote-profile')) {
    const _url = url.searchParams.get('url')
    const _name = decodeURIComponent(url.hash).slice(1) || sampleID()

    if (!_url) {
      message.error('URL missing')
      return
    }

    try {
      await subscribesStore.importSubscribe(_name, _url)
      message.success('common.success')
    } catch {
      message.error('URL missing')
    }
  }
})

EventsOn('onBeforeExitApp', async () => {
  if (appSettings.app.exitOnClose) {
    exitApp()
  } else {
    WindowHide()
  }
})

EventsOn('exitApp', () => exitApp())

appSettings.setupAppSettings().then(async () => {
  await Promise.all([
    envStore.setupEnv(),
    profilesStore.setupProfiles(),
    subscribesStore.setupSubscribes(),
    rulesetsStore.setupRulesets(),
    pluginsStore.setupPlugins(),
    scheduledTasksStore.setupScheduledTasks(),
  ])

  if (await IsStartup()) {
    console.log('OnStartup')
    pluginsStore.onStartupTrigger().catch(message.error)
  }

  console.log('OnReady')
  pluginsStore.onReadyTrigger().catch(message.error)

  await sleep(1000)
  loading.value = false
  kernelApiStore.updateKernelState()
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

  <Modal
    v-model:open="appStore.showAbout"
    :cancel="false"
    :submit="false"
    mask-closable
    min-width="50"
  >
    <AboutView />
  </Modal>

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

  <CommandView v-if="!loading" />
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
