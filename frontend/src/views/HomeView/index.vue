<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { APP_TITLE, sleep } from '@/utils'
import { useMessage, useBool } from '@/hooks'
import { useAppSettingsStore, useProfilesStore, useKernelApiStore, useEnvStore } from '@/stores'

import QuickStart from './QuickStart.vue'
import OverView from './OverView.vue'
import KernelLogs from './KernelLogs.vue'
import LogsController from './LogsController.vue'
import GroupsController from './GroupsController.vue'
import CommonController from './CommonController.vue'

const kernelLoading = ref(false)
const showController = ref(false)
const controllerRef = ref<HTMLElement>()

const { t } = useI18n()
const { message } = useMessage()
const [showApiLogs, toggleApiLogs] = useBool(false)
const [showKernelLogs, toggleKernelLogs] = useBool(false)
const [showSettings, toggleSettingsModal] = useBool(false)
const [showQuickStart, toggleQuickStart] = useBool(false)

const appSettingsStore = useAppSettingsStore()
const profilesStore = useProfilesStore()
const kernelApiStore = useKernelApiStore()
const envStore = useEnvStore()

const handleStartKernel = async () => {
  kernelLoading.value = true

  try {
    await kernelApiStore.startKernel()
  } catch (error: any) {
    console.error(error)
    message.error(error)
    kernelLoading.value = false
  }

  await sleep(4000)

  kernelLoading.value = false
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

const onMouseWheel = (e: WheelEvent) => {
  if (!appSettingsStore.app.kernel.running) return
  const isDown = e.deltaY > 0

  showController.value = isDown || controllerRef.value?.scrollTop !== 0
}

const onTunSwitchChange = async (enable: boolean) => {
  try {
    await kernelApiStore.updateConfig('tun', enable)
    // await envStore.clearSystemProxy()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const onSystemProxySwitchChange = async (enable: boolean) => {
  try {
    await envStore.switchSystemProxy(enable)
    // await kernelApiStore.updateConfig('tun', false)
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
        <Button @click="toggleQuickStart" type="primary">{{ t('home.quickStart') }}</Button>
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
          <Card @click="toggleQuickStart" class="profiles-card">
            {{ t('home.quickStart') }}
          </Card>
        </div>
        <Button @click="handleStartKernel" :loading="kernelApiStore.loading" type="primary">
          {{ t('home.overview.start') }}
        </Button>
        <Button @click="toggleKernelLogs" type="link" size="small">
          {{ t('home.overview.viewlog') }}
        </Button>
      </template>
    </div>

    <template v-else-if="!kernelApiStore.statusLoading">
      <div :class="{ blur: showController }">
        <div class="kernel-status">
          <Button @click="toggleSettingsModal" type="text" size="small">
            <Icon icon="settings" />
          </Button>
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
            @click="toggleApiLogs"
            v-tips="'home.overview.viewlog'"
            type="text"
            size="small"
            class="ml-auto"
          >
            <Icon icon="log" />
          </Button>
          <Button
            @click="handleRestartKernel"
            v-tips="'home.overview.restart'"
            type="text"
            size="small"
          >
            <Icon icon="restart" />
          </Button>
          <Button @click="handleStopKernel" v-tips="'home.overview.stop'" type="text" size="small">
            <Icon icon="stop" />
          </Button>
        </div>
        <OverView />
        <Divider>
          <Button @click="showController = true" type="link" size="small">
            {{ t('home.controller.name') }}
          </Button>
        </Divider>
      </div>

      <div ref="controllerRef" :class="{ expanded: showController }" class="controller">
        <Divider style="margin: 0 12px">
          <Button @click="showController = false" type="text" size="small">
            <Icon icon="close" />
          </Button>
        </Divider>
        <GroupsController />
      </div>
    </template>
  </div>

  <Modal v-model:open="showApiLogs" :submit="false" width="90" height="90" title="Logs">
    <LogsController />
  </Modal>

  <Modal v-model:open="showQuickStart" :title="t('subscribes.enterLink')" :footer="false">
    <QuickStart />
  </Modal>

  <Modal
    v-model:open="showSettings"
    :title="t('home.overview.settings')"
    :submit="false"
    cancel-text="common.close"
    width="90"
    mask-closable
  >
    <CommonController />
  </Modal>

  <Modal
    v-model:open="showKernelLogs"
    :title="t('home.overview.viewlog')"
    :submit="false"
    width="90"
    height="90"
  >
    <KernelLogs />
  </Modal>
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
  .ml-4 {
    margin-left: 4px;
  }
  .ml-8 {
    margin-left: 8px;
  }
  .ml-auto {
    margin-left: auto;
  }
}

.controller {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 100%;
  overflow-y: auto;
  transition: all 0.4s;
}

.expanded {
  top: 0;
}

.profiles {
  margin-bottom: 16px;
  display: flex;
  max-width: 90%;
  overflow-x: hidden;
  &-card {
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
