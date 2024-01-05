<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { useAppSettingsStore } from '@/stores'
import { Theme, Lang, WindowStartState, Color } from '@/constant'
import { APP_TITLE, APP_VERSION, getTaskSchXmlString } from '@/utils'
import {
  CheckPermissions,
  SwitchPermissions,
  BrowserOpenURL,
  GetEnv,
  Writefile,
  QuerySchTask,
  CreateSchTask,
  DeleteSchTask,
  Removefile
} from '@/utils/bridge'

const isAdmin = ref(false)
const isTaskScheduled = ref(false)

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()

const themes = [
  {
    label: 'settings.theme.dark',
    value: Theme.Dark
  },
  {
    label: 'settings.theme.light',
    value: Theme.Light
  },
  {
    label: 'settings.theme.auto',
    value: Theme.Auto
  }
]

const colors = [
  {
    label: 'settings.color.default',
    value: Color.Default
  },
  {
    label: 'settings.color.orange',
    value: Color.Orange
  },
  {
    label: 'settings.color.pink',
    value: Color.Pink
  },
  {
    label: 'settings.color.skyblue',
    value: Color.Skyblue
  }
]

const langs = [
  {
    label: 'settings.lang.zh',
    value: Lang.ZH
  },
  {
    label: 'settings.lang.en',
    value: Lang.EN
  }
]

const windowStates = [
  { label: 'settings.windowState.normal', value: WindowStartState.Normal },
  // { label: 'settings.windowState.maximised', value: WindowStartState.Maximised },
  { label: 'settings.windowState.minimised', value: WindowStartState.Minimised }
  // { label: 'settings.windowState.fullscreen', value: WindowStartState.Fullscreen }
]

const resetFontFamily = () => {
  appSettings.app['font-family'] = '"Microsoft Yahei", "Arial", sans-serif, "Twemoji Mozilla"'
}

const resetUserAgent = () => {
  appSettings.app.userAgent = APP_TITLE + '/' + APP_VERSION
}

const onPermChange = async (v: boolean) => {
  try {
    await SwitchPermissions(v)
    message.info('success')
  } catch (error: any) {
    message.info(error)
    console.log(error)
  }
}

const handleOpenFolder = async () => {
  const { basePath } = await GetEnv()
  BrowserOpenURL(basePath)
}

const checkSchtask = async () => {
  try {
    await QuerySchTask(APP_TITLE)
    isTaskScheduled.value = true
  } catch (error) {
    isTaskScheduled.value = false
  }
}

const onTaskSchChange = async (v: boolean) => {
  try {
    if (v) {
      createSchTask(appSettings.app.startupDelay)
    } else {
      await DeleteSchTask(APP_TITLE)
    }
  } catch (error: any) {
    console.error(error)
    message.info(error)
    isTaskScheduled.value = !v
  }
}

const onStartupDelayChange = async (delay: number) => {
  try {
    createSchTask(delay)
  } catch (error: any) {
    console.error(error)
    message.info(error)
  }
}

const createSchTask = async (delay = 30) => {
  const xmlPath = 'data/tasksch.xml'
  const xmlContent = await getTaskSchXmlString(delay)
  await Writefile(xmlPath, xmlContent)
  await CreateSchTask(APP_TITLE, xmlPath)
  await Removefile(xmlPath)
}

CheckPermissions().then((admin) => {
  isAdmin.value = admin
})

checkSchtask()
</script>

<template>
  <div class="settings">
    <div class="settings-item">
      <div class="title">
        {{ t('settings.theme.name') }}
      </div>
      <Radio v-model="appSettings.app.theme" :options="themes" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.color.name') }}
      </div>
      <Radio v-model="appSettings.app.color" :options="colors" />
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.lang.name') }}</div>
      <Radio v-model="appSettings.app.lang" :options="langs" />
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.fontFamily') }}</div>
      <div style="display: flex; align-items: center">
        <Button @click="resetFontFamily" v-tips="'settings.resetFont'" type="text">
          <Icon icon="reset" />
        </Button>
        <Input
          v-model="appSettings.app['font-family']"
          :delay="1000"
          editable
          style="margin-left: 8px"
        />
      </div>
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.appFolder.name') }}</div>
      <Button @click="handleOpenFolder" type="primary">
        <Icon icon="folder" fill="var(--btn-primary-color)" />
        <span style="margin-left: 8px">{{ t('settings.appFolder.open') }}</span>
      </Button>
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.exitOnClose') }}
      </div>
      <Switch v-model="appSettings.app.exitOnClose" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.closeKernelOnExit') }}
      </div>
      <Switch v-model="appSettings.app.closeKernelOnExit" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.autoSetSystemProxy') }}
      </div>
      <Switch v-model="appSettings.app.autoSetSystemProxy" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.autoStartKernel') }}
      </div>
      <Switch v-model="appSettings.app.autoStartKernel" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.admin') }}
        <span class="tips">({{ t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="isAdmin" @change="onPermChange" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.startup.name') }}
      </div>
      <div style="display: flex; align-items: center">
        <Switch v-model="isTaskScheduled" @change="onTaskSchChange" style="margin-right: 16px" />
        <template v-if="isTaskScheduled">
          <Radio v-model="appSettings.app.windowStartState" :options="windowStates" type="number" />
          <span style="margin: 0 8px">{{ t('settings.startup.delay') }}</span>
          <Input
            v-model="appSettings.app.startupDelay"
            @submit="onStartupDelayChange"
            :min="0"
            type="number"
          />
        </template>
      </div>
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.userAgent.name') }}</div>
      <div style="display: flex; align-items: center">
        <Button @click="resetUserAgent" v-tips="'settings.userAgent.reset'" type="text">
          <Icon icon="reset" />
        </Button>
        <Input
          v-model="appSettings.app.userAgent"
          :delay="1000"
          editable
          style="margin-left: 8px"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.settings {
  &-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 16px;
    .title {
      align-self: flex-start;
      font-size: 18px;
      font-weight: bold;
      padding: 8px 0 16px 0;
      .tips {
        font-weight: normal;
        font-size: 12px;
      }
    }
  }
}
</style>
