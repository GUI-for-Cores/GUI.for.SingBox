<script setup lang="ts">
import { ref } from 'vue'

import { type Menu, useAppSettingsStore } from '@/stores'
import { APP_TITLE, APP_VERSION, ignoredError } from '@/utils'
import {
  WindowFullscreen,
  WindowIsFullscreen,
  WindowUnfullscreen,
  WindowSetAlwaysOnTop,
  WindowHide,
  Quit,
  KernelRunning,
  KillProcess,
  ClearSystemProxy,
  WindowSetSize,
  WindowCenter
} from '@/utils/bridge'

const isPinned = ref(false)
const isFullScreen = ref(false)

const appSettingsStore = useAppSettingsStore()

const toggleFullScreen = async () => {
  const isFull = await WindowIsFullscreen()
  isFull ? WindowUnfullscreen() : WindowFullscreen()
  isFullScreen.value = !isFull
}

const pinWindow = () => {
  isPinned.value = !isPinned.value
  WindowSetAlwaysOnTop(isPinned.value)
}

const closeWindow = async () => {
  const {
    exitOnClose,
    closeKernelOnExit,
    kernel: { pid }
  } = appSettingsStore.app

  if (exitOnClose && closeKernelOnExit) {
    await ClearSystemProxy()
    const running = await ignoredError<boolean>(KernelRunning, pid)
    if (running) {
      await ignoredError(KillProcess, pid)
    }
  }

  exitOnClose ? Quit() : WindowHide()
}

const menus: Menu[] = [
  {
    label: 'titlebar.resetSize',
    handler: async () => {
      WindowUnfullscreen()
      await WindowSetSize(800, 540)
      WindowCenter()
      isFullScreen.value = false
    }
  }
]
</script>

<template>
  <div @dblclick="toggleFullScreen" class="titlebar" style="--wails-draggable: drag">
    <img class="logo" draggable="false" src="@/assets/logo.png" />
    <div
      :style="{
        color: appSettingsStore.app.kernel.running ? 'var(--primary-color)' : 'var(--color)'
      }"
      class="appname"
    >
      {{ APP_TITLE }} {{ APP_VERSION }}
    </div>
    <div v-menu="menus" class="menus"></div>
    <div class="action" style="--wails-draggable: disabled">
      <Button @click.stop="pinWindow" type="text">
        <Icon :icon="isPinned ? 'pinFill' : 'pin'" />
      </Button>
      <Button @click.stop="WindowHide" type="text">
        <Icon icon="minimize" />
      </Button>
      <Button @click.stop="toggleFullScreen" type="text">
        <Icon :icon="isFullScreen ? 'maximize2' : 'maximize'" />
      </Button>
      <Button @click.stop="closeWindow" type="text">
        <Icon icon="close" />
      </Button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.titlebar {
  user-select: none;
  display: flex;
  padding: 4px 12px;
  align-items: center;
}
.logo {
  width: 24px;
  height: 24px;
  user-select: none;
}
.appname {
  font-size: 14px;
  margin-left: 4px;
  margin-top: 2px;
  font-weight: bold;
}

.menus {
  flex: 1;
  height: 100%;
}
.action {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  &-btn {
    width: 32px;
    height: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 4px;
    &:hover {
      background-color: var(--hover-bg-color);
    }
  }
}
</style>
