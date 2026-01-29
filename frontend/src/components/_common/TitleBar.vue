<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import logo from '@/assets/logo'
import {
  WindowSetAlwaysOnTop,
  WindowHide,
  WindowMinimise,
  WindowSetSize,
  WindowReloadApp,
  WindowToggleMaximise,
  WindowIsMaximised,
  RestartApp,
} from '@/bridge'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, useAppStore } from '@/stores'
import { APP_TITLE, APP_VERSION, debounce, exitApp } from '@/utils'

import type { Menu } from '@/types/app'

const isPinned = ref(false)
const isMaximised = ref(false)

const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()
const appStore = useAppStore()

const isDarwin = envStore.env.os === 'darwin'

const pinWindow = () => {
  isPinned.value = !isPinned.value
  WindowSetAlwaysOnTop(isPinned.value)
}

const closeWindow = async () => {
  if (appSettingsStore.app.exitOnClose) {
    exitApp()
  } else {
    WindowHide()
  }
}

const menus: Menu[] = [
  {
    label: 'titlebar.resetSize',
    handler: () => WindowSetSize(800, 540),
  },
  {
    label: 'titlebar.reload',
    handler: WindowReloadApp,
  },
  {
    label: 'titlebar.restart',
    handler: RestartApp,
  },
  {
    label: 'titlebar.exitApp',
    handler: exitApp,
  },
]

const onResize = debounce(async () => {
  isMaximised.value = await WindowIsMaximised()
}, 100)

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div v-menu="menus" class="flex items-center py-8 gap-8 px-12" style="--wails-draggable: drag">
    <img v-if="!isDarwin" class="w-24 h-24" draggable="false" :src="logo" />

    <div
      :class="isDarwin ? 'justify-center py-4 text-12' : 'text-14'"
      :style="{
        color: kernelApiStore.running ? 'var(--primary-color)' : 'var(--color)',
      }"
      class="font-bold w-full h-full flex items-center"
      @dblclick="WindowToggleMaximise"
    >
      {{ APP_TITLE }} {{ APP_VERSION }}
      <CustomAction :actions="appStore.customActions.title_bar" />
      <Icon
        v-if="kernelApiStore.starting || kernelApiStore.stopping || kernelApiStore.restarting"
        :size="14"
        icon="loading"
        class="rotation mx-4"
      />
    </div>

    <div
      v-if="!isDarwin"
      class="ml-auto flex items-center gap-4"
      style="--wails-draggable: disabled"
    >
      <Button type="text" :icon="isPinned ? 'pinFill' : 'pin'" @click.stop="pinWindow" />
      <Button icon="minimize" type="text" @click.stop="WindowMinimise" />
      <Button
        :icon="isMaximised ? 'maximize2' : 'maximize'"
        type="text"
        @click.stop="WindowToggleMaximise"
      />
      <Button
        :class="{ 'hover:!bg-red': appSettingsStore.app.exitOnClose }"
        :loading="appStore.isAppExiting"
        icon="close"
        type="text"
        @click.stop="closeWindow"
      />
    </div>
  </div>
</template>
