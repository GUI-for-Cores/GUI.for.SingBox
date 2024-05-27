<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onUnmounted } from 'vue'

import { useBool } from '@/hooks'
import { getKernelWS } from '@/api/kernel'
import { useKernelApiStore } from '@/stores'
import { ModeOptions } from '@/constant/kernel'
import { formatBytes, handleChangeMode, setIntervalImmediately } from '@/utils'

import ConnectionsController from './ConnectionsController.vue'

const trafficHistory = ref<[number[], number[]]>([[], []])
const statistics = ref({
  upload: 0,
  download: 0,
  downloadTotal: 0,
  uploadTotal: 0,
  connections: [],
  inuse: 0
})

const { t } = useI18n()
const kernelApiStore = useKernelApiStore()
const [showKernelConnections, toggleKernelConnections] = useBool(false)

const isActiveMode = (mode: string) => kernelApiStore.config.mode === mode

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
    <div class="statistics">
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
        @click="toggleKernelConnections"
        :title="t('home.overview.connections')"
        class="statistics-card"
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
          :selected="isActiveMode(mode.value)"
          @click="handleChangeMode(mode.value as any)"
          :title="t(mode.label)"
          class="mode-card"
        >
          <div class="desp">{{ t(mode.desp) }}</div>
        </Card>
      </div>
    </div>
  </div>

  <Modal
    v-model:open="showKernelConnections"
    :title="t('home.overview.connections')"
    :submit="false"
    mask-closable
    cancel-text="common.close"
    width="90"
    height="90"
  >
    <div @wheel.stop="($event) => 0" style="height: 100%">
      <ConnectionsController />
    </div>
  </Modal>
</template>

<style lang="less" scoped>
.overview {
  margin-top: 20px;
  .statistics {
    display: flex;
    justify-content: space-between;
    &-card {
      width: calc(100% / 4 - 8px);
      &:nth-child(3) {
        cursor: pointer;
      }
      .detail {
        padding: 4px 0;
        font-size: 12px;
        line-height: 2;
      }
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
        .desp {
          line-height: 20px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
