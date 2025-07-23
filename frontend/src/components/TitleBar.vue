<script setup lang="ts">
import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue'

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
const rollingReleaseVersion = ref('')

const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()
const appStore = useAppStore()

const isWindows = envStore.env.os === 'windows'
const isDarwin = envStore.env.os === 'darwin'

const TitleBar = defineComponent((_, { slots }) => {
  if (!isWindows && !isDarwin) return () => ''
  return () =>
    h(
      'div',
      {
        class: 'flex items-center py-8 gap-8 px-12',
        style: '--wails-draggable: drag',
      },
      [isWindows && slots.logo?.(), slots.title?.(), isWindows && slots.actions?.()],
    )
})

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

const updateRollingReleaseState = async () => {
  try {
    const res = await fetch('/version.txt')
    const txt = await res.text()
    if (txt && txt.length === 7) {
      rollingReleaseVersion.value = `(${txt})`
    }
  } catch (error) {
    console.log('Not a rolling release', error)
  }
}

updateRollingReleaseState()

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <TitleBar v-menu="menus">
    <template #logo>
      <img class="w-24 h-24" draggable="false" src="@/assets/logo.png" />
    </template>

    <template #title>
      <div
        @dblclick="WindowToggleMaximise"
        :class="isDarwin ? 'justify-center py-4 text-12' : 'text-14'"
        :style="{
          color: appSettingsStore.app.kernel.running ? 'var(--primary-color)' : 'var(--color)',
        }"
        class="font-bold w-full h-full flex items-center"
      >
        {{ APP_TITLE }} {{ APP_VERSION }} {{ rollingReleaseVersion || '' }}
        {{ rollingReleaseVersion ? '- Rolling Release' : '' }}
        <Button v-if="kernelApiStore.loading" type="text" size="small" loading />
      </div>
    </template>

    <template #actions>
      <div class="ml-auto flex items-center gap-4" style="--wails-draggable: disabled">
        <Button @click.stop="pinWindow" type="text" :icon="isPinned ? 'pinFill' : 'pin'" />
        <Button @click.stop="WindowMinimise" icon="minimize" type="text" />
        <Button
          @click.stop="WindowToggleMaximise"
          :icon="isMaximised ? 'maximize2' : 'maximize'"
          type="text"
        />
        <Button
          @click.stop="closeWindow"
          :class="{ 'hover:!bg-red': appSettingsStore.app.exitOnClose }"
          :loading="appStore.isAppExiting"
          icon="close"
          type="text"
        />
      </div>
    </template>
  </TitleBar>
</template>
