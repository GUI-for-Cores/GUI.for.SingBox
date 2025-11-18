<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { BrowserOpenURL, WriteFile, RemoveFile, AbsolutePath, MakeDir } from '@/bridge'
import { DefaultFontFamily, LocalesFilePath } from '@/constant/app'
import { Theme, WindowStartState, Color, WebviewGpuPolicy } from '@/enums/app'
import routes from '@/router/routes'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import {
  APP_TITLE,
  APP_VERSION,
  APP_LOCALES_URL,
  getTaskSchXmlString,
  message,
  QuerySchTask,
  CreateSchTask,
  DeleteSchTask,
  CheckPermissions,
  SwitchPermissions,
} from '@/utils'

const isAdmin = ref(false)
const isTaskScheduled = ref(false)

const { t } = useI18n()
const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

const themes = [
  {
    label: 'settings.theme.dark',
    value: Theme.Dark,
  },
  {
    label: 'settings.theme.light',
    value: Theme.Light,
  },
  {
    label: 'settings.theme.auto',
    value: Theme.Auto,
  },
]

const colors = [
  {
    label: 'settings.color.default',
    value: Color.Default,
  },
  {
    label: 'settings.color.orange',
    value: Color.Orange,
  },
  {
    label: 'settings.color.pink',
    value: Color.Pink,
  },
  {
    label: 'settings.color.red',
    value: Color.Red,
  },
  {
    label: 'settings.color.skyblue',
    value: Color.Skyblue,
  },
  {
    label: 'settings.color.green',
    value: Color.Green,
  },
  {
    label: 'settings.color.purple',
    value: Color.Purple,
  },
]

const pages = routes.flatMap((route) => {
  if (route.meta?.hidden !== undefined) return []
  return {
    label: route.meta!.name,
    value: route.name as string,
  }
})

const windowStates = [
  { label: 'settings.windowState.normal', value: WindowStartState.Normal },
  { label: 'settings.windowState.minimised', value: WindowStartState.Minimised },
]

const webviewGpuPolicy = [
  { label: 'settings.webviewGpuPolicy.always', value: WebviewGpuPolicy.Always },
  { label: 'settings.webviewGpuPolicy.onDemand', value: WebviewGpuPolicy.OnDemand },
  { label: 'settings.webviewGpuPolicy.never', value: WebviewGpuPolicy.Never },
]

const resetFontFamily = () => {
  appSettings.app.fontFamily = DefaultFontFamily
}

const clearUserAgent = () => {
  appSettings.app.userAgent = ''
}

const clearApiToken = () => {
  appSettings.app.githubApiToken = ''
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
  BrowserOpenURL(envStore.env.basePath)
}

const handleOpenLocalesFolder = async () => {
  await MakeDir(LocalesFilePath)
  const path = await AbsolutePath(LocalesFilePath)
  BrowserOpenURL(path)
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
  await WriteFile(xmlPath, xmlContent)
  await CreateSchTask(APP_TITLE, await AbsolutePath(xmlPath))
  await RemoveFile(xmlPath)
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
  <div class="flex flex-col gap-8 pr-20 mb-8">
    <div class="px-8 py-12 text-18 font-bold">{{ t('settings.personalization') }}</div>

    <Card>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.theme.name') }}</div>
        <Radio v-model="appSettings.app.theme" @click="onThemeClick" :options="themes" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.color.name') }}</div>
        <Radio v-model="appSettings.app.color" :options="colors" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="flex items-center text-16 font-bold">
          <div class="mr-4">{{ t('settings.lang.name') }}</div>
          <Button @click="BrowserOpenURL(APP_LOCALES_URL)" type="text" icon="link2" />
          <Button @click="handleOpenLocalesFolder" type="text" icon="folder" />
          <Button
            @click="appSettings.loadLocales()"
            :loading="appSettings.localesLoading"
            v-tips="'settings.lang.load'"
            type="text"
            icon="refresh"
          />
        </div>
        <Radio v-model="appSettings.app.lang" :options="appSettings.locales" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.fontFamily') }}</div>
        <Input v-model="appSettings.app.fontFamily" editable class="text-14">
          <template #suffix>
            <Button
              @click="resetFontFamily"
              v-tips="'settings.resetFont'"
              type="text"
              size="small"
              icon="reset"
            />
          </template>
        </Input>
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.pages.name') }}</div>
        <CheckBox v-model="appSettings.app.pages" :options="pages" />
      </div>
    </Card>

    <div class="px-8 py-12 text-18 font-bold">{{ t('settings.behavior') }}</div>

    <Card>
      <div
        v-if="envStore.env.os === 'windows'"
        class="px-8 py-12 flex items-center justify-between"
      >
        <div class="text-16 font-bold">
          {{ t('settings.admin') }}
          <span class="font-normal text-12">({{ t('settings.needRestart') }})</span>
        </div>
        <Switch v-model="isAdmin" @change="onPermChange" />
      </div>
      <div
        v-if="envStore.env.os === 'windows'"
        class="px-8 py-12 flex items-center justify-between"
      >
        <div class="text-16 font-bold">
          {{ t('settings.startup.name') }}
          <span class="font-normal text-12">({{ t('settings.needAdmin') }})</span>
        </div>
        <div class="flex items-center">
          <Radio
            v-if="isTaskScheduled"
            v-model="appSettings.app.windowStartState"
            :options="windowStates"
            type="number"
          />
          <Switch v-model="isTaskScheduled" @change="onTaskSchChange" class="ml-16" />
        </div>
      </div>
      <div
        v-if="envStore.env.os === 'windows' && isTaskScheduled"
        class="px-8 py-12 flex items-center justify-between"
      >
        <div class="text-16 font-bold">
          {{ t('settings.startup.startupDelay') }}
          <span class="font-normal text-12">({{ t('settings.needAdmin') }})</span>
        </div>
        <Input
          v-model="appSettings.app.startupDelay"
          @submit="onStartupDelayChange"
          :min="10"
          :max="180"
          editable
          type="number"
        >
          <template #suffix>
            <span class="ml-4">{{ t('settings.startup.delay') }}</span>
          </template>
        </Input>
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.exitOnClose') }}</div>
        <Switch v-model="appSettings.app.exitOnClose" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.autoStartKernel') }}</div>
        <Switch v-model="appSettings.app.autoStartKernel" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.closeKernelOnExit') }}</div>
        <Switch v-model="appSettings.app.closeKernelOnExit" />
      </div>
      <div v-if="envStore.env.os === 'linux'" class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">
          {{ t('settings.webviewGpuPolicy.name') }}
          <span class="font-normal text-12">({{ t('settings.needRestart') }})</span>
        </div>
        <Radio v-model="appSettings.app.webviewGpuPolicy" :options="webviewGpuPolicy" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.addPluginToMenu') }}</div>
        <Switch v-model="appSettings.app.addPluginToMenu" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.addGroupToMenu') }}</div>
        <Switch v-model="appSettings.app.addGroupToMenu" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">
          {{ t('settings.multipleInstance') }}
          <span class="font-normal text-12">({{ t('settings.needRestart') }})</span>
        </div>
        <Switch v-model="appSettings.app.multipleInstance" />
      </div>
    </Card>

    <div class="px-8 py-12 text-18 font-bold">{{ t('settings.systemProxy') }}</div>

    <Card>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.autoSetSystemProxy') }}</div>
        <Switch v-model="appSettings.app.autoSetSystemProxy" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">
          {{ t('settings.proxyBypassList') }}
          <span class="font-normal text-12">({{ t('settings.proxyBypassListTips') }})</span>
        </div>
        <CodeViewer
          v-model="appSettings.app.proxyBypassList"
          editable
          lang="yaml"
          class="min-w-256"
        />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.userAgent.name') }}</div>
        <Input
          v-model.lazy="appSettings.app.userAgent"
          :placeholder="APP_TITLE + '/' + APP_VERSION"
          editable
          class="text-14"
        >
          <template #suffix>
            <Button
              @click="clearUserAgent"
              v-tips="'settings.userAgent.reset'"
              type="text"
              size="small"
              icon="reset"
            />
          </template>
        </Input>
      </div>
    </Card>

    <div class="px-8 py-12 text-18 font-bold">{{ t('settings.advanced') }}</div>

    <Card>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.appFolder.name') }}</div>
        <Button @click="handleOpenFolder" type="primary" icon="folder">
          <span class="ml-8">{{ t('settings.appFolder.open') }}</span>
        </Button>
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">
          {{ t('settings.rollingRelease') }}
          <span class="font-normal text-12">({{ t('settings.needRestart') }})</span>
        </div>
        <Switch v-model="appSettings.app.rollingRelease" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.realMemoryUsage') }}</div>
        <Switch v-model="appSettings.app.kernel.realMemoryUsage" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">
          {{ t('settings.autoRestartKernel.name') }}
          <span class="font-normal text-12">({{ t('settings.autoRestartKernel.tips') }})</span>
        </div>
        <Switch v-model="appSettings.app.autoRestartKernel" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">
          {{ t('settings.githubapi.name') }}
          <span class="font-normal text-12">({{ t('settings.githubapi.tips') }})</span>
        </div>
        <Input v-model.lazy="appSettings.app.githubApiToken" editable class="text-14">
          <template #suffix>
            <Button
              @click="clearApiToken"
              v-tips="'settings.userAgent.reset'"
              type="text"
              size="small"
              icon="reset"
            />
          </template>
        </Input>
      </div>
    </Card>

    <div class="px-8 py-12 text-18 font-bold">{{ t('settings.debug') }}</div>

    <Card>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.debugOutline') }}</div>
        <Switch v-model="appSettings.app.debugOutline" />
      </div>
      <div class="px-8 py-12 flex items-center justify-between">
        <div class="text-16 font-bold">{{ t('settings.debugNoAnimation') }}</div>
        <Switch v-model="appSettings.app.debugNoAnimation" />
      </div>
    </Card>
  </div>
</template>
