<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { ProcessMemory } from '@/bridge'
import { ModeOptions } from '@/constant/kernel'
import { useEnvStore, useAppStore, useKernelApiStore, useAppSettingsStore } from '@/stores'
import { formatBytes, handleChangeMode, message, modal } from '@/utils'

import CommonController from './CommonController.vue'
import ConnectionsController from './ConnectionsController.vue'
import LogsController from './LogsController.vue'

const trafficHistory = ref<[number[], number[]]>([[], []])
const statistics = ref({
  upload: 0,
  download: 0,
  downloadTotal: 0,
  uploadTotal: 0,
  connections: [] as any[],
  inuse: 0,
  memUsage: 0,
})

const { t } = useI18n()
const appStore = useAppStore()
const envStore = useEnvStore()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const handleRestartKernel = async () => {
  try {
    await kernelApiStore.restartCore()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const handleStopKernel = async () => {
  try {
    await kernelApiStore.stopCore()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const handleShowApiLogs = () => {
  const m = modal({
    title: 'Logs',
    cancelText: 'common.close',
    px: 0,
    py: 0,
    width: '90',
    height: '90',
    submit: false,
    maskClosable: true,
  })
  m.setContent(LogsController).open()
}

const handleShowApiConnections = () => {
  const m = modal({
    title: 'home.overview.connections',
    cancelText: 'common.close',
    px: 0,
    py: 0,
    width: '90',
    height: '90',
    submit: false,
    maskClosable: true,
  })
  m.setContent(ConnectionsController).open()
}

const handleToggleRealMemoryUsage = () => {
  appSettings.app.kernel.realMemoryUsage = !appSettings.app.kernel.realMemoryUsage
}

const handleShowSettings = () => {
  const m = modal({
    title: 'home.overview.settings',
    cancelText: 'common.close',
    width: '90',
    submit: false,
    maskClosable: true,
  })
  m.setContent(CommonController).open()
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

let latestCoreMemoryUsageTime: number
const getCoreMemoryUsage = async (fallback: number) => {
  if (latestCoreMemoryUsageTime && Date.now() - latestCoreMemoryUsageTime < 30_000) {
    return fallback
  }
  const useage = await ProcessMemory(kernelApiStore.pid).catch(() => fallback)
  latestCoreMemoryUsageTime = Date.now()
  return useage
}

const unregisterMemoryHandler = kernelApiStore.onMemory(async (data) => {
  statistics.value.inuse = data.inuse
  if (appSettings.app.kernel.realMemoryUsage) {
    getCoreMemoryUsage(statistics.value.memUsage || data.inuse).then((usage) => {
      statistics.value.memUsage = usage
    })
  }
})

const unregisterTrafficHandler = kernelApiStore.onTraffic((data) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down

  trafficHistory.value[0].push(up)
  trafficHistory.value[1].push(down)

  if (trafficHistory.value[0].length > 60) {
    trafficHistory.value[0].shift()
    trafficHistory.value[1].shift()
  }
})

const unregisterConnectionsHandler = kernelApiStore.onConnections((data) => {
  statistics.value.downloadTotal = data.downloadTotal
  statistics.value.uploadTotal = data.uploadTotal
  statistics.value.connections = data.connections || []
})

onUnmounted(() => {
  unregisterMemoryHandler()
  unregisterTrafficHandler()
  unregisterConnectionsHandler()
})
</script>

<template>
  <div class="home-overview">
    <div
      class="overview-toolbar flex items-center rounded-8 px-8 py-4"
      style="background-color: var(--card-bg)"
    >
      <Button type="text" size="small" icon="settings" @click="handleShowSettings" />
      <Switch
        v-model="envStore.systemProxy"
        size="small"
        border="square"
        class="ml-4"
        @change="onSystemProxySwitchChange"
      >
        {{ t('home.overview.systemProxy') }}
      </Switch>
      <Switch
        v-model="kernelApiStore.config.tun.enable"
        size="small"
        border="square"
        class="ml-8"
        @change="onTunSwitchChange"
      >
        {{ t('home.overview.tunMode') }}
      </Switch>
      <CustomAction :actions="appStore.customActions.core_state" />
      <Button
        v-tips="'home.overview.viewlog'"
        type="text"
        size="small"
        icon="log"
        class="ml-auto"
        @click="handleShowApiLogs"
      />
      <Button
        v-tips="'home.overview.restart'"
        :loading="kernelApiStore.restarting"
        type="text"
        size="small"
        icon="restart"
        @click="handleRestartKernel"
      />
      <Button
        v-tips="'home.overview.stop'"
        :loading="kernelApiStore.stopping"
        type="text"
        size="small"
        icon="stop"
        @click="handleStopKernel"
      />
    </div>
    <div class="home-stats flex mt-20 gap-12">
      <Card
        :title="t('home.overview.realtimeTraffic')"
        class="home-stat-card home-stat-card--realtime flex-1"
      >
        <div class="home-stat-card__value flex gap-8 py-8 text-12">
          <span class="metric metric--upload">↑ {{ formatBytes(statistics.upload) }}/s</span>
          <span class="metric metric--download">↓ {{ formatBytes(statistics.download) }}/s</span>
        </div>
      </Card>
      <Card
        :title="t('home.overview.totalTraffic')"
        class="home-stat-card home-stat-card--total flex-1"
      >
        <div class="home-stat-card__value flex gap-8 py-8 text-12">
          <span class="metric metric--upload">↑ {{ formatBytes(statistics.uploadTotal) }}</span>
          <span class="metric metric--download">↓ {{ formatBytes(statistics.downloadTotal) }}</span>
        </div>
      </Card>
      <Card
        :title="t('home.overview.connections')"
        class="home-stat-card home-stat-card--connections flex-1 cursor-pointer"
        @click="handleShowApiConnections"
      >
        <div class="home-stat-card__value py-8 text-12">
          {{ statistics.connections.length }}
        </div>
      </Card>
      <Card
        :title="t('home.overview.memory')"
        class="home-stat-card home-stat-card--memory flex-1 cursor-pointer"
        @click="handleToggleRealMemoryUsage"
      >
        <div class="home-stat-card__value py-8 text-12">
          {{ formatBytes(statistics.inuse) }}
          <span v-if="appSettings.app.kernel.realMemoryUsage">
            / ({{ formatBytes(statistics.memUsage) }})
          </span>
        </div>
      </Card>
    </div>
    <div class="home-dashboard flex">
      <div class="traffic-panel w-[60%]">
        <div class="traffic-panel__art" aria-hidden="true"></div>
        <div class="traffic-panel__title py-16 font-bold" style="color: var(--card-color)">
          {{ t('home.overview.traffic') }}
        </div>
        <TrafficChart
          :series="trafficHistory"
          :legend="[t('home.overview.transmit'), t('home.overview.receive')]"
        />
      </div>
      <div class="mode-panel ml-12 flex-1">
        <div class="mode-panel__title py-16 font-bold" style="color: var(--card-color)">
          {{ t('kernel.mode') }}
        </div>
        <div class="mode-panel__list flex flex-col gap-12">
          <Card
            v-for="mode in ModeOptions"
            :key="mode.value"
            :selected="kernelApiStore.config.mode === mode.value"
            :title="t(mode.label)"
            :class="['home-mode-card', `home-mode-card--${String(mode.value).toLowerCase()}`]"
            class="cursor-pointer"
            @click="handleChangeMode(mode.value as any)"
          >
            <div class="text-12 py-2">{{ t(mode.desc) }}</div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
