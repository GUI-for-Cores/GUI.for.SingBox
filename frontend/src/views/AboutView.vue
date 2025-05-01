<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores'
import { RestartApp, BrowserOpenURL } from '@/bridge'
import { APP_TITLE, APP_VERSION, PROJECT_URL, TG_GROUP, TG_CHANNEL, message } from '@/utils'

const { t } = useI18n()
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
  <div class="about">
    <img src="@/assets/logo.png" style="width: 128px" draggable="false" />
    <div class="appname">{{ APP_TITLE }}</div>
    <div class="appver">
      <Button v-if="appStore.restartable" @click="handleRestartApp" size="small" type="primary">
        <Icon icon="restartApp" fill="var(--btn-primary-color)" style="margin-top: 1px" />
        <span style="margin-left: 4px">{{ t('about.restart') }}</span>
      </Button>
      <template v-else>
        <Button
          @click="appStore.checkForUpdates(true)"
          :loading="appStore.checkForUpdatesLoading"
          type="link"
          size="small"
        >
          {{ APP_VERSION }}
        </Button>
        <Button
          v-if="appStore.updatable"
          @click="appStore.downloadApp"
          :loading="appStore.downloading"
          size="small"
        >
          {{ t('about.new') }}: {{ appStore.remoteVersion }}
        </Button>
      </template>
    </div>
    <div @click="BrowserOpenURL(PROJECT_URL)" class="url"><Icon icon="github" />GitHub</div>
    <div @click="BrowserOpenURL(TG_GROUP)" class="url"><Icon icon="telegram" />Telegram Group</div>
    <div @click="BrowserOpenURL(TG_CHANNEL)" class="url">
      <Icon icon="telegram" />Telegram Channel
    </div>
  </div>
</template>

<style lang="less" scoped>
.about {
  padding: 36px 0 0 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .appname {
    font-weight: bold;
    font-size: 16px;
    padding: 8px 0;
  }
  .appver {
    font-size: 12px;
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    min-height: 40px;
  }
  .url {
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 12px;
    text-decoration: underline;
  }
}
</style>
