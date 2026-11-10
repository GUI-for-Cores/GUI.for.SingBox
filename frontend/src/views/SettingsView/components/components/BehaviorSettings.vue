<script lang="ts" setup>
import { ref } from 'vue'

import { RestartApp } from '@/bridge'
import { WebviewGpuPolicyOptions, WindowStateOptions } from '@/constant/app'
import { OS } from '@/enums/app'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import {
  confirm,
  message,
  CheckPermissions,
  SwitchPermissions,
  IsAutoStartEnabled,
  EnableAutoStart,
  DisableAutoStart,
} from '@/utils'

const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

const isAdmin = ref(false)
const isAutoStart = ref(false)

const onPermChange = async (v: boolean) => {
  try {
    await SwitchPermissions(v)
    if (v !== envStore.env.isPrivileged) {
      const ok = await confirm('Notice', 'Restart the application now?').catch(() => 0)
      ok && (await RestartApp(v))
    }
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
}

const onTaskSchChange = async (v: boolean) => {
  isAutoStart.value = !v

  try {
    await (v ? EnableAutoStart() : DisableAutoStart())
    isAutoStart.value = v
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const onAutoStartOptionChange = async <K extends 'startupDelay' | 'windowStartState'>(
  key: K,
  value: App.AppSettings[K],
) => {
  const old = appSettings.app[key]
  if (old === value) return
  appSettings.app[key] = value
  try {
    await EnableAutoStart()
  } catch (error: any) {
    appSettings.app[key] = old
    console.error(error)
    message.error(error)
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
          @click="RestartApp(isAdmin)"
        />
        <Switch v-model="isAdmin" @change="onPermChange" />
      </div>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.startup.name') }}
      </div>
      <div class="flex items-center">
        <Radio
          v-if="isAutoStart"
          :model-value="appSettings.app.windowStartState"
          :options="WindowStateOptions"
          @change="(v: App.WindowStartState) => onAutoStartOptionChange('windowStartState', v)"
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
      </div>
      <Input
        :model-value="appSettings.app.startupDelay"
        :min="10"
        :max="180"
        editable
        type="number"
        @submit="(v) => onAutoStartOptionChange('startupDelay', v)"
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
