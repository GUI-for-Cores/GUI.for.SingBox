<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { APP_TITLE, APP_VERSION, debounce, exitApp } from '@/utils'
import { useAppSettingsStore, useKernelApiStore, useEnvStore } from '@/stores'
import {
  WindowSetAlwaysOnTop,
  WindowHide,
  WindowMinimise,
  WindowSetSize,
  WindowReloadApp,
  WindowToggleMaximise,
  WindowIsMaximised,
  RestartApp
} from '@/bridge'

const isPinned = ref(false)
const isMaximised = ref(false)
const rollingReleaseVersion = ref('')

const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()

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
    handler: () => WindowSetSize(800, 540)
  },
  {
    label: 'titlebar.reload',
    handler: WindowReloadApp
  },
  {
    label: 'titlebar.restart',
    handler: RestartApp
  },
  {
    label: 'titlebar.exitApp',
    handler: exitApp
  }
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
  <div
    v-if="envStore.env.os === 'windows'"
    @dblclick="WindowToggleMaximise"
    class="titlebar"
    style="--wails-draggable: drag"
  >
    <img class="logo" draggable="false" src="@/assets/logo.png" />
    <div
      :style="{
        color: appSettingsStore.app.kernel.running ? 'var(--primary-color)' : 'var(--color)'
      }"
      class="appname"
    >
      {{ APP_TITLE }} {{ APP_VERSION }} {{ rollingReleaseVersion || '' }}
      {{ rollingReleaseVersion ? '- Rolling Release' : '' }}
    </div>
    <Button v-if="kernelApiStore.loading" loading type="text" size="small" />
    <div v-menu="menus" class="menus"></div>
    <div class="action" style="--wails-draggable: disabled">
      <Button @click.stop="pinWindow" type="text">
        <Icon :icon="isPinned ? 'pinFill' : 'pin'" />
      </Button>
      <Button @click.stop="WindowMinimise" type="text">
        <Icon icon="minimize" />
      </Button>
      <Button @click.stop="WindowToggleMaximise" type="text">
        <Icon :icon="isMaximised ? 'maximize2' : 'maximize'" />
      </Button>
      <Button
        @click.stop="closeWindow"
        :class="{ 'hover-red': appSettingsStore.app.exitOnClose }"
        type="text"
      >
        <Icon icon="close" />
      </Button>
    </div>
  </div>
  <div v-else-if="envStore.env.os === 'darwin'" class="placeholder" style="--wails-draggable: drag">
    <div
      :style="{
        color: appSettingsStore.app.kernel.running ? 'var(--primary-color)' : 'var(--color)'
      }"
      v-menu="menus"
      class="appname"
    >
      {{ APP_TITLE }} {{ APP_VERSION }} {{ rollingReleaseVersion || '' }}
      {{ rollingReleaseVersion ? '- Rolling Release' : '' }}
    </div>
    <Button v-if="kernelApiStore.loading" loading type="text" size="small" />
  </div>
</template>

<style lang="less" scoped>
.titlebar {
  display: flex;
  padding: 4px 12px;
  align-items: center;
}
.logo {
  width: 24px;
  height: 24px;
}
.appname {
  font-size: 14px;
  margin-left: 8px;
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
.placeholder {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  .appname {
    font-size: 12px;
  }
}

.hover-red:hover {
  background: rgba(255, 0, 0, 0.6);
}
</style>
