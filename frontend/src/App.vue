<script setup lang="ts">
import { ref } from 'vue'

import { EventsOn, WindowHide, IsStartup } from '@/bridge'
import { NavigationBar, TitleBar } from '@/components'
import * as Stores from '@/stores'
import { exitApp, sampleID, sleep, message } from '@/utils'
import AboutView from '@/views/AboutView.vue'
import CommandView from '@/views/CommandView.vue'
import SplashView from '@/views/SplashView.vue'

const loading = ref(true)
const percent = ref(0)
const hasError = ref(false)

const envStore = Stores.useEnvStore()
const appStore = Stores.useAppStore()
const pluginsStore = Stores.usePluginsStore()
const profilesStore = Stores.useProfilesStore()
const rulesetsStore = Stores.useRulesetsStore()
const appSettings = Stores.useAppSettingsStore()
const kernelApiStore = Stores.useKernelApiStore()
const subscribesStore = Stores.useSubscribesStore()
const scheduledTasksStore = Stores.useScheduledTasksStore()

EventsOn('onLaunchApp', async (args: string[]) => {
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const closeFn = appStore.modalStack.at(-1)
    closeFn?.()
  }
})

envStore.setupEnv().then(async () => {
  const showError = (err: string) => {
    hasError.value = true
    message.error(err)
  }

  await Promise.all([
    appSettings.setupAppSettings(),
    profilesStore.setupProfiles(),
    subscribesStore.setupSubscribes(),
    rulesetsStore.setupRulesets(),
    pluginsStore.setupPlugins(),
    scheduledTasksStore.setupScheduledTasks(),
  ])

  const startTime = performance.now()
  percent.value = 20
  if (await IsStartup()) {
    await pluginsStore.onStartupTrigger().catch(showError)
  }

  percent.value = 40
  await pluginsStore.onReadyTrigger().catch(showError)

  const duration = performance.now() - startTime
  percent.value = duration < 500 ? 80 : 100

  await sleep(Math.max(0, 1000 - duration))

  loading.value = false
  kernelApiStore.updateKernelState()
})
</script>

<template>
  <SplashView v-if="loading">
    <Progress
      :percent="percent"
      :status="hasError ? 'danger' : 'primary'"
      :radius="10"
      type="circle"
    />
  </SplashView>
  <template v-else>
    <TitleBar />
    <div class="flex-1 overflow-y-auto flex flex-col p-8">
      <NavigationBar />
      <div class="flex flex-col overflow-y-auto mt-8 px-8 h-full">
        <RouterView #="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </div>
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
