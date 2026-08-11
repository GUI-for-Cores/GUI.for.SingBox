<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import logo from '@/assets/logo'
import {
  WindowSetAlwaysOnTop,
  WindowHide,
  WindowMinimise,
  WindowSetSize,
  WindowToggleMaximise,
  WindowIsMaximised,
  RestartApp,
} from '@/bridge'
import { OS } from '@/enums/app'
import { useAppSettingsStore, useKernelApiStore, useEnvStore, useAppStore } from '@/stores'
import { APP_TITLE, APP_VERSION, debounce, exitApp, reloadApp } from '@/utils'

const isPinned = ref(false)
const isMaximised = ref(false)

const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()
const appStore = useAppStore()

const isDarwin = envStore.env.os === OS.Darwin

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

const menus: App.Menu[] = [
  {
    label: 'titlebar.resetSize',
    handler: () => WindowSetSize(800, 540),
  },
  {
    label: 'titlebar.reload',
    handler: reloadApp,
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
  <div
    v-menu="menus"
    class="app-titlebar flex items-center py-8 gap-8 px-12"
    style="--wails-draggable: drag"
  >
    <img v-if="!isDarwin" class="app-titlebar__logo w-24 h-24" draggable="false" :src="logo" />

    <div
      :class="isDarwin ? 'justify-center py-4 text-12' : 'text-14'"
      :style="{
        color: kernelApiStore.running ? 'var(--primary-color)' : 'var(--color)',
      }"
      class="app-titlebar__brand font-bold w-full h-full flex items-center gap-4 duration-200"
      @dblclick="WindowToggleMaximise"
    >
      <span class="app-titlebar__name">{{ APP_TITLE }}</span>
      <span class="app-titlebar__version">{{ APP_VERSION }}</span>
      <div
        v-if="appStore.customActions.title_bar.length"
        class="app-titlebar__custom-actions inline-flex items-center"
      >
        <CustomAction :actions="appStore.customActions.title_bar" />
      </div>
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
      <Button
        class="window-control"
        type="text"
        :icon="isPinned ? 'pinFill' : 'pin'"
        @click.stop="pinWindow"
      />
      <Button class="window-control" icon="minimize" type="text" @click.stop="WindowMinimise" />
      <Button
        class="window-control"
        :icon="isMaximised ? 'maximize2' : 'maximize'"
        type="text"
        @click.stop="WindowToggleMaximise"
      />
      <Button
        :class="[
          'window-control window-control--close',
          { 'hover:!bg-red': appSettingsStore.app.exitOnClose },
        ]"
        :loading="appStore.isAppExiting || appStore.isAppReloading"
        icon="close"
        type="text"
        @click.stop="closeWindow"
      />
    </div>
  </div>
</template>
