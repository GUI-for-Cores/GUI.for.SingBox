<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onUnmounted, h } from 'vue'

import { getKernelWS } from '@/api/kernel'
import { useModal } from '@/components/Modal'
import { useEnvStore, useKernelApiStore } from '@/stores'
import { ModeOptions } from '@/constant/kernel'
import { formatBytes, handleChangeMode, message, setIntervalImmediately } from '@/utils'

import LogsController from './LogsController.vue'
import CommonController from './CommonController.vue'
import ConnectionsController from './ConnectionsController.vue'

const trafficHistory = ref<[number[], number[]]>([[], []])
const statistics = ref({
  upload: 0,
  download: 0,
  downloadTotal: 0,
  uploadTotal: 0,
  connections: [],
  inuse: 0,
})

const { t } = useI18n()
const [Modal, modalApi] = useModal({})
const envStore = useEnvStore()
const kernelApiStore = useKernelApiStore()

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

const handleShowApiConnections = () => {
  modalApi
    .setProps({
      title: 'home.overview.connections',
      cancelText: 'common.close',
      width: '90',
      height: '90',
      submit: false,
      maskClosable: true,
    })
    .setComponent(h(ConnectionsController))
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

const onConnections = (data: any) => {
  statistics.value.downloadTotal = data.downloadTotal
  statistics.value.uploadTotal = data.uploadTotal
  statistics.value.connections = data.connections || []
}

const onTraffic = (data: any) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down

  trafficHistory.value[0].push(up)
  trafficHistory.value[1].push(down)

  if (trafficHistory.value[0].length > 60) {
    trafficHistory.value[0].shift()
    trafficHistory.value[1].shift()
  }
}

const onMemory = (data: any) => {
  statistics.value.inuse = data.inuse
}

const { connect, disconnect } = getKernelWS({ onConnections, onTraffic, onMemory })
const timer = setIntervalImmediately(connect, 3000)

onUnmounted(() => {
  clearInterval(timer)
  disconnect()
})
</script>

<template>
  <div class="overview">
    <div class="flex items-center rounded-8 px-8 py-2" style="background-color: var(--card-bg)">
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
    <div class="flex justify-between" style="margin-top: 20px; gap: 12px">
      <Card :title="t('home.overview.realtimeTraffic')" class="statistics-card">
        <div class="detail">
          ↑ {{ formatBytes(statistics.upload) }}/s ↓ {{ formatBytes(statistics.download) }}/s
        </div>
      </Card>
      <Card :title="t('home.overview.totalTraffic')" class="statistics-card">
        <div class="detail">
          ↑ {{ formatBytes(statistics.uploadTotal) }} ↓ {{ formatBytes(statistics.downloadTotal) }}
        </div>
      </Card>
      <Card
        @click="handleShowApiConnections"
        :title="t('home.overview.connections')"
        class="statistics-card cursor-pointer"
      >
        <div class="detail">
          {{ statistics.connections.length }}
        </div>
      </Card>
      <Card :title="t('home.overview.memory')" class="statistics-card">
        <div class="detail">
          {{ formatBytes(statistics.inuse) }}
        </div>
      </Card>
    </div>
    <div class="row">
      <div class="traffic">
        <div class="title">{{ t('home.overview.traffic') }}</div>
        <TrafficChart
          :series="trafficHistory"
          :legend="[t('home.overview.transmit'), t('home.overview.receive')]"
        />
      </div>
      <div class="mode">
        <div class="title">{{ t('kernel.mode') }}</div>
        <Card
          v-for="mode in ModeOptions"
          :key="mode.value"
          :selected="kernelApiStore.config.mode === mode.value"
          @click="handleChangeMode(mode.value as any)"
          :title="t(mode.label)"
          class="mode-card"
        >
          <div class="desc">{{ t(mode.desc) }}</div>
        </Card>
      </div>
    </div>
  </div>

  <Modal />
</template>

<style lang="less" scoped>
.overview {
  .statistics-card {
    flex: 1;
    .detail {
      padding: 4px 0;
      font-size: 12px;
      line-height: 2;
    }
  }

  .title {
    padding: 14px 0;
    font-weight: bold;
    color: var(--card-color);
  }
  .row {
    display: flex;
    .traffic {
      width: 60%;
    }
    .mode {
      margin-left: 8px;
      flex: 1;
      .mode-card {
        cursor: pointer;
        &:nth-child(3) {
          margin: 12px 0;
        }
        .desc {
          line-height: 20px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
