<script lang="ts" setup>
import { ref } from 'vue'

import { ExitApp } from '@/bridge'
import { WebviewGpuPolicyOptions, WindowStateOptions } from '@/constant/app'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import {
  confirm,
  message,
  CheckPermissions,
  SwitchPermissions,
  RunWithPowerShell,
  IsAutoStartEnabled,
  EnableAutoStart,
  DisableAutoStart,
} from '@/utils'
import { OS } from '@/enums/app'

const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

const isAdmin = ref(false)
const isAutoStart = ref(false)

const restartApp = async (admin = false) => {
  if (admin) {
    await RunWithPowerShell(envStore.env.appPath, [], { admin, wait: false })
  } else {
    await RunWithPowerShell('explorer', [envStore.env.appPath], { wait: false })
  }
  await ExitApp()
}

const onPermChange = async (v: boolean) => {
  try {
    await SwitchPermissions(v)
    if (v !== envStore.env.isPrivileged) {
      const ok = await confirm('Notice', 'Restart the application now?').catch(() => 0)
      ok && (await restartApp(v))
    }
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
}

const onTaskSchChange = async (v: boolean) => {
  isAutoStart.value = !v

  try {
    await (v ? EnableAutoStart(appSettings.app.startupDelay) : DisableAutoStart())
    isAutoStart.value = v
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const onStartupDelayChange = async (delay: number) => {
  if (appSettings.app.startupDelay !== delay) {
    try {
      await EnableAutoStart(delay)
      appSettings.app.startupDelay = delay
    } catch (error: any) {
      console.error(error)
      message.error(error)
    }
  }
}

IsAutoStartEnabled().then((res) => {
  isAutoStart.value = res
})

if (envStore.env.os === OS.Windows) {
  CheckPermissions().then((admin) => {
    isAdmin.value = admin
  })
}
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.behavior') }}</div>

  <Card>
    <div v-platform="[OS.Windows]" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.admin') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <div class="flex items-center gap-4">
        <Button
          v-if="envStore.env.isPrivileged !== isAdmin"
          v-tips="'titlebar.restart'"
          type="primary"
          icon="refresh"
          size="small"
          @click="() => restartApp(isAdmin)"
        />
        <Switch v-model="isAdmin" @change="onPermChange" />
      </div>
    </div>
    <div v-platform="[OS.Windows, OS.Darwin]" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.startup.name') }}
        <span v-platform="[OS.Windows]" class="font-normal text-12">
          ({{ $t('settings.needAdmin') }})
        </span>
      </div>
      <div class="flex items-center">
        <Radio
          v-if="isAutoStart"
          v-model="appSettings.app.windowStartState"
          :options="WindowStateOptions"
          type="number"
        />
        <Switch v-model="isAutoStart" class="ml-16" @change="onTaskSchChange" />
      </div>
    </div>
    <div
      v-if="isAutoStart"
      v-platform="[OS.Windows]"
      class="px-8 py-12 flex items-center justify-between"
    >
      <div class="text-16 font-bold">
        {{ $t('settings.startup.startupDelay') }}
        <span class="font-normal text-12">({{ $t('settings.needAdmin') }})</span>
      </div>
      <Input
        :model-value="appSettings.app.startupDelay"
        :min="10"
        :max="180"
        editable
        type="number"
        @submit="onStartupDelayChange"
      >
        <template #suffix="{ showInput }">
          <span class="ml-4" @click="showInput">{{ $t('settings.startup.delay') }}</span>
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
    <div v-platform="[OS.Linux]" class="px-8 py-12 flex items-center justify-between">
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
