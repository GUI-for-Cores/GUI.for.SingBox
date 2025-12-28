<script lang="ts" setup>
import { ref } from 'vue'

import { WriteFile, RemoveFile, AbsolutePath } from '@/bridge'
import { WebviewGpuPolicyOptions, WindowStateOptions } from '@/constant/app'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import {
  APP_TITLE,
  getTaskSchXmlString,
  message,
  QuerySchTask,
  CreateSchTask,
  DeleteSchTask,
  CheckPermissions,
  SwitchPermissions,
} from '@/utils'

const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

const isAdmin = ref(false)
const isTaskScheduled = ref(false)

const onPermChange = async (v: boolean) => {
  try {
    await SwitchPermissions(v)
    message.success('common.success')
  } catch (error: any) {
    message.error(error)
    console.log(error)
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
  if (appSettings.app.startupDelay !== delay) {
    try {
      await createSchTask(delay)
      appSettings.app.startupDelay = delay
    } catch (error: any) {
      console.error(error)
      message.error(error)
    }
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

const createSchTask = async (delay = 30) => {
  const xmlPath = 'data/.cache/tasksch.xml'
  const xmlContent = await getTaskSchXmlString(delay)
  await WriteFile(xmlPath, xmlContent)
  await CreateSchTask(APP_TITLE, await AbsolutePath(xmlPath))
  await RemoveFile(xmlPath)
}

if (envStore.env.os === 'windows') {
  checkSchtask()

  CheckPermissions().then((admin) => {
    isAdmin.value = admin
  })
}
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.behavior') }}</div>

  <Card>
    <div v-platform="['windows']" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.admin') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="isAdmin" @change="onPermChange" />
    </div>
    <div v-platform="['windows']" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.startup.name') }}
        <span class="font-normal text-12">({{ $t('settings.needAdmin') }})</span>
      </div>
      <div class="flex items-center">
        <Radio
          v-if="isTaskScheduled"
          v-model="appSettings.app.windowStartState"
          :options="WindowStateOptions"
          type="number"
        />
        <Switch v-model="isTaskScheduled" @change="onTaskSchChange" class="ml-16" />
      </div>
    </div>
    <div
      v-if="isTaskScheduled"
      v-platform="['windows']"
      class="px-8 py-12 flex items-center justify-between"
    >
      <div class="text-16 font-bold">
        {{ $t('settings.startup.startupDelay') }}
        <span class="font-normal text-12">({{ $t('settings.needAdmin') }})</span>
      </div>
      <Input
        :model-value="appSettings.app.startupDelay"
        @submit="onStartupDelayChange"
        :min="10"
        :max="180"
        editable
        type="number"
      >
        <template #suffix="{ showInput }">
          <span @click="showInput" class="ml-4">{{ $t('settings.startup.delay') }}</span>
        </template>
      </Input>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.exitOnClose') }}</div>
      <Switch v-model="appSettings.app.exitOnClose" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.autoStartKernel') }}</div>
      <Switch v-model="appSettings.app.autoStartKernel" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.closeKernelOnExit') }}</div>
      <Switch v-model="appSettings.app.closeKernelOnExit" />
    </div>
    <div v-platform="['linux']" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.webviewGpuPolicy.name') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <Radio v-model="appSettings.app.webviewGpuPolicy" :options="WebviewGpuPolicyOptions" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.addPluginToMenu') }}</div>
      <Switch v-model="appSettings.app.addPluginToMenu" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.addGroupToMenu') }}</div>
      <Switch v-model="appSettings.app.addGroupToMenu" />
    </div>
  </Card>
</template>
