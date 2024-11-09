<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import routes from '@/router/routes'
import { APP_TITLE, APP_VERSION, getTaskSchXmlString } from '@/utils'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import { BrowserOpenURL, GetEnv, Writefile, Removefile, AbsolutePath } from '@/bridge'
import {
  Theme,
  Lang,
  WindowStartState,
  Color,
  KernelCacheFilePath,
  DefaultFontFamily,
  WebviewGpuPolicy
} from '@/constant'
import {
  QuerySchTask,
  CreateSchTask,
  DeleteSchTask,
  CheckPermissions,
  SwitchPermissions
} from '@/utils'

const isAdmin = ref(false)
const isTaskScheduled = ref(false)

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

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
    label: 'settings.color.red',
    value: Color.Red
  },
  {
    label: 'settings.color.skyblue',
    value: Color.Skyblue
  },
  {
    label: 'settings.color.green',
    value: Color.Green
  },
  {
    label: 'settings.color.purple',
    value: Color.Purple
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

const pages = routes.flatMap((route) => {
  if (route.meta?.hidden !== undefined) return []
  return {
    label: route.meta!.name,
    value: route.name as string
  }
})

const windowStates = [
  { label: 'settings.windowState.normal', value: WindowStartState.Normal },
  { label: 'settings.windowState.minimised', value: WindowStartState.Minimised }
]

const webviewGpuPolicy = [
  { label: 'settings.webviewGpuPolicy.always', value: WebviewGpuPolicy.Always },
  { label: 'settings.webviewGpuPolicy.onDemand', value: WebviewGpuPolicy.OnDemand },
  { label: 'settings.webviewGpuPolicy.never', value: WebviewGpuPolicy.Never }
]

const resetFontFamily = () => {
  appSettings.app['font-family'] = DefaultFontFamily
}

const resetUserAgent = () => {
  appSettings.app.userAgent = APP_TITLE + '/' + APP_VERSION
}

const onPermChange = async (v: boolean) => {
  try {
    await SwitchPermissions(v)
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
}

const handleOpenFolder = async () => {
  const { basePath } = await GetEnv()
  BrowserOpenURL(basePath)
}

const handleClearKernelCache = async () => {
  try {
    await Removefile(KernelCacheFilePath)
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
}

const checkSchtask = async () => {
  try {
    await QuerySchTask(APP_TITLE)
    isTaskScheduled.value = true
  } catch {
    isTaskScheduled.value = false
  }
}

const onTaskSchChange = async (v: boolean) => {
  isTaskScheduled.value = !v
  try {
    if (v) {
      await createSchTask(appSettings.app.startupDelay)
    } else {
      await DeleteSchTask(APP_TITLE)
    }
    isTaskScheduled.value = v
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const onStartupDelayChange = async (delay: number) => {
  try {
    await createSchTask(delay)
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const createSchTask = async (delay = 30) => {
  const xmlPath = 'data/.cache/tasksch.xml'
  const xmlContent = await getTaskSchXmlString(delay)
  await Writefile(xmlPath, xmlContent)
  await CreateSchTask(APP_TITLE, await AbsolutePath(xmlPath))
  await Removefile(xmlPath)
}

const onThemeClick = (e: MouseEvent) => {
  document.documentElement.style.setProperty('--x', e.clientX + 'px')
  document.documentElement.style.setProperty('--y', e.clientY + 'px')
}

if (envStore.env.os === 'windows') {
  checkSchtask()

  CheckPermissions().then((admin) => {
    isAdmin.value = admin
  })
}
</script>

<template>
  <div class="settings">
    <div class="settings-item">
      <div class="title">
        {{ t('settings.theme.name') }}
      </div>
      <Radio v-model="appSettings.app.theme" @click="onThemeClick" :options="themes" />
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
        <Button @click="resetFontFamily" v-tips="'settings.resetFont'" type="text" icon="reset" />
        <Input v-model="appSettings.app['font-family']" editable style="margin-left: 8px" />
      </div>
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.pages.name') }}</div>
      <CheckBox v-model="appSettings.app.pages" :options="pages" />
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.appFolder.name') }}</div>
      <Button @click="handleOpenFolder" type="primary" icon="folder">
        <span style="margin-left: 8px">{{ t('settings.appFolder.open') }}</span>
      </Button>
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.kernelCache.name') }}</div>
      <Button @click="handleClearKernelCache" type="primary" icon="reset">
        <span style="margin-left: 8px">{{ t('settings.kernelCache.clear') }}</span>
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
    <div v-if="envStore.env.os === 'windows'" class="settings-item">
      <div class="title">
        {{ t('settings.admin') }}
        <span class="tips">({{ t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="isAdmin" @change="onPermChange" />
    </div>
    <div v-if="envStore.env.os === 'linux'" class="settings-item">
      <div class="title">
        {{ t('settings.webviewGpuPolicy.name') }}
        <span class="tips">({{ t('settings.needRestart') }})</span>
      </div>
      <Radio v-model="appSettings.app.webviewGpuPolicy" :options="webviewGpuPolicy" />
    </div>
    <div v-if="envStore.env.os === 'windows'" class="settings-item">
      <div class="title">
        {{ t('settings.startup.name') }}
        <span class="tips">({{ t('settings.needAdmin') }})</span>
      </div>
      <div style="display: flex; align-items: center">
        <Switch v-model="isTaskScheduled" @change="onTaskSchChange" style="margin-right: 16px" />
        <template v-if="isTaskScheduled">
          <Radio v-model="appSettings.app.windowStartState" :options="windowStates" type="number" />
          <Input
            v-model="appSettings.app.startupDelay"
            @submit="onStartupDelayChange"
            :min="0"
            type="number"
            class="ml-4"
          >
            <template #extra>
              <span class="ml-4">{{ t('settings.startup.delay') }}</span>
            </template>
          </Input>
        </template>
      </div>
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.addToMenu') }}</div>
      <Switch v-model="appSettings.app.addPluginToMenu" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.multipleInstance') }}
        <span class="tips">({{ t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="appSettings.app.multipleInstance" />
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.rollingRelease') }}
        <span class="tips">({{ t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="appSettings.app.rollingRelease" />
    </div>
    <div class="settings-item">
      <div class="title">{{ t('settings.userAgent.name') }}</div>
      <div style="display: flex; align-items: center">
        <Button
          @click="resetUserAgent"
          v-tips="'settings.userAgent.reset'"
          type="text"
          icon="reset"
        />
        <Input v-model.lazy="appSettings.app.userAgent" editable style="margin-left: 8px" />
      </div>
    </div>
    <div class="settings-item">
      <div class="title">
        {{ t('settings.githubapi.name') }}
        <span class="tips">({{ t('settings.githubapi.tips') }})</span>
      </div>
      <Input v-model.lazy="appSettings.app.githubApiToken" editable />
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
