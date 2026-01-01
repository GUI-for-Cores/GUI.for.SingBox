<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { RestartApp, BrowserOpenURL } from '@/bridge'
import { useAppStore, useEnvStore } from '@/stores'
import { APP_TITLE, APP_VERSION, PROJECT_URL, TG_GROUP, TG_CHANNEL, message } from '@/utils'

const { t } = useI18n()
const envStore = useEnvStore()
const appStore = useAppStore()

const handleRestartApp = async () => {
  try {
    await RestartApp()
  } catch (error: any) {
    message.error(error)
  }
}

appStore.checkForUpdates()
</script>

<template>
  <div class="flex flex-col items-center pt-36">
    <img src="@/assets/logo.png" class="w-128" draggable="false" />
    <div class="py-8 font-bold">{{ APP_TITLE }}</div>
    <div class="flex items-center pb-8 my-4">
      <Button
        v-if="appStore.restartable"
        icon="restartApp"
        size="small"
        type="primary"
        @click="handleRestartApp"
      >
        {{ t('about.restart') }}
      </Button>
      <template v-else>
        <Button
          :loading="appStore.checkForUpdatesLoading"
          type="link"
          size="small"
          @click="appStore.checkForUpdates(true)"
        >
          Bridge: {{ envStore.env.appVersion }} - UI: {{ APP_VERSION }}
        </Button>
        <Button
          v-if="appStore.updatable"
          :loading="appStore.downloading"
          size="small"
          @click="appStore.downloadApp"
        >
          {{ t('about.new') }}: {{ appStore.remoteVersion }}
        </Button>
      </template>
    </div>
    <div
      class="text-12 underline flex items-center cursor-pointer"
      @click="BrowserOpenURL(PROJECT_URL)"
    >
      <Icon icon="github" />GitHub
    </div>
    <div
      class="text-12 underline flex items-center cursor-pointer"
      @click="BrowserOpenURL(TG_GROUP)"
    >
      <Icon icon="telegram" />Telegram Group
    </div>
    <div
      class="text-12 underline flex items-center cursor-pointer"
      @click="BrowserOpenURL(TG_CHANNEL)"
    >
      <Icon icon="telegram" />Telegram Channel
    </div>
  </div>
</template>
