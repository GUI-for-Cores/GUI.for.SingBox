<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import logo from '@/assets/logo'
import { BrowserOpenURL, ExitApp, RestartApp } from '@/bridge'
import { OS } from '@/enums/app'
import { useAppStore, useEnvStore } from '@/stores'
import {
  APP_TITLE,
  APP_VERSION,
  PROJECT_URL,
  TG_GROUP,
  TG_CHANNEL,
  message,
  RunWithOsaScript,
} from '@/utils'

const { t } = useI18n()
const envStore = useEnvStore()
const appStore = useAppStore()

const handleRestartApp = async () => {
  try {
    if (envStore.env.os === OS.Darwin) {
      RunWithOsaScript('open', [envStore.env.appPath], {
        wait: false,
      })
      await ExitApp()
    } else {
      await RestartApp()
    }
  } catch (error: any) {
    message.error(error)
  }
}

if (Date.now() - appStore.lastCheckTime > 60_000) {
  appStore.checkForUpdates()
}

defineExpose({
  modalSlots: {
    toolbar: () => [
      h(
        resolveComponent('Button'),
        {
          type: 'link',
          icon: 'github',
          size: 'small',
          onClick: () => BrowserOpenURL(PROJECT_URL),
        },
        () => 'GitHub',
      ),
      h(
        resolveComponent('Button'),
        {
          type: 'link',
          icon: 'telegram',
          size: 'small',
          onClick: () => BrowserOpenURL(TG_GROUP),
        },
        () => 'TG Group',
      ),
      h(
        resolveComponent('Button'),
        {
          type: 'link',
          icon: 'telegram',
          size: 'small',
          onClick: () => BrowserOpenURL(TG_CHANNEL),
        },
        () => 'TG Channel',
      ),
    ],
  },
})
</script>

<template>
  <div class="flex flex-col items-center py-12">
    <img :src="logo" class="w-64" draggable="false" />
    <div class="py-8 font-bold">{{ APP_TITLE }}</div>
    <div class="flex items-center">
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
          type="text"
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
  </div>
</template>
