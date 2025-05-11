<script setup lang="ts">
import { ref, watch, useTemplateRef, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { APP_TITLE, debounce, message } from '@/utils'
import { useAppSettingsStore, useProfilesStore, useKernelApiStore, useEnvStore } from '@/stores'

import { useModal } from '@/components/Modal'
import QuickStart from './components/QuickStart.vue'
import OverView from './components/OverView.vue'
import KernelLogs from './components/KernelLogs.vue'
import LogsController from './components/LogsController.vue'
import GroupsController from './components/GroupsController.vue'
import CommonController from './components/CommonController.vue'

const showController = ref(false)
const controllerRef = useTemplateRef('controllerRef')

const { t } = useI18n()
const [Modal, modalApi] = useModal({})

const appSettingsStore = useAppSettingsStore()
const profilesStore = useProfilesStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()

const handleStartKernel = async () => {
  try {
    await kernelApiStore.startKernel()
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  }
}

const handleRestartKernel = async () => {
  try {
    await kernelApiStore.restartKernel()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const handleStopKernel = async () => {
  try {
    await kernelApiStore.stopKernel()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const handleShowApiLogs = () => {
  modalApi
    .setProps({
      title: 'Logs',
      cancelText: 'common.close',
      width: '90',
      height: '90',
      submit: false,
      maskClosable: true,
    })
    .setComponent(h(LogsController))
    .open()
}

const handleShowQuickStart = () => {
  modalApi
    .setProps({
      title: 'subscribes.enterLink',
      footer: false,
      maskClosable: true,
    })
    .setComponent(h(QuickStart))
    .open()
}

const handleShowSettings = () => {
  modalApi
    .setProps({
      title: 'home.overview.settings',
      cancelText: 'common.close',
      width: '90',
      submit: false,
      maskClosable: true,
    })
    .setComponent(h(CommonController))
    .open()
}

const handleShowKernelLogs = () => {
  modalApi
    .setProps({
      title: 'home.overview.viewlog',
      width: '90',
      height: '90',
      submit: false,
      maskClosable: true,
    })
    .setComponent(h(KernelLogs))
    .open()
}

let scrollEventCount = 0
const resetScrollEventCount = debounce(() => (scrollEventCount = 0), 100)

const onMouseWheel = (e: WheelEvent) => {
  if (!appSettingsStore.app.kernel.running) return

  const currentScrollTop = controllerRef.value?.scrollTop ?? 0
  const isScrollingDown = e.deltaY > 0

  if (isScrollingDown || currentScrollTop === 0) {
    scrollEventCount += 1
  }

  if (scrollEventCount >= 3) {
    showController.value = isScrollingDown || currentScrollTop !== 0
  }

  resetScrollEventCount()
}

const onTunSwitchChange = async (enable: boolean) => {
  try {
    await kernelApiStore.updateConfig('tun', { enable })
  } catch (error: any) {
    kernelApiStore.config.tun.enable = !kernelApiStore.config.tun.enable
    console.error(error)
    message.error(error)
  }
}

const onSystemProxySwitchChange = async (enable: boolean) => {
  try {
    await envStore.switchSystemProxy(enable)
  } catch (error: any) {
    console.error(error)
    message.error(error)
    envStore.systemProxy = !envStore.systemProxy
  }
}

watch(showController, (v) => {
  if (v) {
    kernelApiStore.refreshProviderProxies()
  } else {
    kernelApiStore.refreshConfig()
  }
})
</script>

<template>
  <div @wheel="onMouseWheel" class="homeview">
    <div v-if="!appSettingsStore.app.kernel.running || kernelApiStore.loading" class="center">
      <img src="@/assets/logo.png" draggable="false" style="margin-bottom: 16px; height: 128px" />

      <template v-if="profilesStore.profiles.length === 0">
        <p>{{ t('home.noProfile', [APP_TITLE]) }}</p>
        <Button @click="handleShowQuickStart" type="primary">{{ t('home.quickStart') }}</Button>
      </template>

      <template v-else>
        <div class="profiles">
          <Card
            v-for="p in profilesStore.profiles.slice(0, 4)"
            :key="p.id"
            :selected="appSettingsStore.app.kernel.profile === p.id"
            @click="appSettingsStore.app.kernel.profile = p.id"
            class="profiles-card"
          >
            {{ p.name }}
          </Card>
          <Card @click="handleShowQuickStart" class="profiles-card">
            {{ t('home.quickStart') }}
          </Card>
        </div>
        <Button @click="handleStartKernel" :loading="kernelApiStore.loading" type="primary">
          {{ t('home.overview.start') }}
        </Button>
        <Button @click="handleShowKernelLogs" type="link" size="small">
          {{ t('home.overview.viewlog') }}
        </Button>
      </template>
    </div>

    <template v-else-if="!kernelApiStore.statusLoading">
      <div :class="{ blur: showController }">
        <div class="kernel-status">
          <Button @click="handleShowSettings" type="text" size="small" icon="settings" />
          <Switch
            v-model="envStore.systemProxy"
            @change="onSystemProxySwitchChange"
            size="small"
            border="square"
            class="ml-4"
          >
            {{ t('home.overview.systemProxy') }}
          </Switch>
          <Switch
            v-model="kernelApiStore.config.tun.enable"
            @change="onTunSwitchChange"
            size="small"
            border="square"
            class="ml-8"
          >
            {{ t('home.overview.tunMode') }}
          </Switch>
          <Button
            @click="handleShowApiLogs"
            v-tips="'home.overview.viewlog'"
            type="text"
            size="small"
            icon="log"
            class="ml-auto"
          />
          <Button
            @click="handleRestartKernel"
            v-tips="'home.overview.restart'"
            type="text"
            size="small"
            icon="restart"
          />
          <Button
            @click="handleStopKernel"
            v-tips="'home.overview.stop'"
            type="text"
            size="small"
            icon="stop"
          />
        </div>
        <OverView />
        <Divider>
          <Button @click="showController = true" type="link" size="small">
            {{ t('home.controller.name') }}
          </Button>
        </Divider>
      </div>

      <div ref="controllerRef" :class="{ expanded: showController }" class="controller">
        <Button
          v-show="showController"
          class="close-controller"
          @click="showController = false"
          type="text"
          size="small"
        >
          <Icon icon="close" />
        </Button>
        <GroupsController />
      </div>
    </template>
  </div>

  <Modal />
</template>

<style lang="less" scoped>
.blur {
  filter: blur(50px);
}
.homeview {
  position: relative;
  overflow: hidden;
  height: 100%;

  .center {
    position: absolute;
    width: 100%;
    height: 90%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

.kernel-status {
  display: flex;
  align-items: center;
  background-color: var(--card-bg);
  padding: 2px 8px;
  border-radius: 8px;
}

.controller {
  position: absolute;
  z-index: 9;
  width: 100%;
  height: 100%;
  top: 100%;
  padding-bottom: 32px;
  overflow-y: auto;
  transition: all 0.4s;
}

.expanded {
  top: 0;
}

.close-controller {
  position: fixed;
  z-index: 2;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  border-radius: 8px;
  background-color: var(--card-bg);
}

.profiles {
  padding-bottom: 16px;
  display: flex;
  max-width: 90%;
  overflow-x: hidden;
  &-card {
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
    width: 120px;
    height: 60px;
    padding-top: 6px;
    margin: 8px;
  }
}
</style>
