<script setup lang="ts">
import { ref, h, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfilesStore, useAppSettingsStore, useSubscribesStore, useKernelApiStore } from '@/stores'
import { message, sampleID, formatBytes, formatDate } from '@/utils'
import vLoading from '@/views/Customize/components/directives/vLoading'

const kernelApiStore = useKernelApiStore()
const appSettingsStore = useAppSettingsStore()
const subscribeStore = useSubscribesStore()

const loading = ref(false)
const { t } = useI18n()

import type { Subscription } from '@/types/app'

onMounted(() => {
  console.log('Component is mounted!2222')
})

console.log('Component is mounted!')

const handleStartKernel = async () => {
  try {
    await kernelApiStore.startCore()
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
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

const handleUpdateSub = async (s: Subscription) => {
  console.log('更新订阅被调用，订阅ID：', s)
  try {
    await subscribeStore.updateSubscribe(s.id)
  } catch (error: any) {
    console.error('updateSubscribe: ', error)
    message.error(error)
  }
}

const statistics = ref({
  upload: 0,
  download: 0,
  downloadTotal: 0,
  uploadTotal: 0,
  connections: [] as any[],
  inuse: 0,
  memUsage: 0,
})

const unregisterTrafficHandler = kernelApiStore.onTraffic((data) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down
})

onUnmounted(() => {
  unregisterTrafficHandler()
})
</script>

<template>
  <div 
    v-for="s in subscribeStore.subscribes" 
    :key="s.id"
    class="bg-white rounded-[20px] overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] mb-[32px]"
  >
    <!-- 顶部区域 -->
    <div class="bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] text-white px-[32px] py-[24px]">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-[28px] font-semibold">欢迎来到 Z-VPN</h1>
          <div class="mt-[12px] flex items-center gap-[12px]">
            <span class="text-[18px] font-medium">{{ appSettingsStore.app.userInfo.userName }}</span>
            <span class="text-[13px] bg-white/25 px-[12px] py-[4px] rounded-full">
              {{ t('subscribes.expire') }}:{{ s.expire ? formatDate(s.expire, 'YYYY-MM-DD HH:mm:ss') : '--' }}
              / 套餐流量：{{ formatBytes(s.download + s.upload, 2) }} / 
              {{ s.total ? formatBytes(s.total, 2) : '--' }}
            </span>
          </div>
        </div>

        <!-- 实时流量 -->
        <div class="text-right">
          <div class="flex items-center gap-[6px] mb-[6px] text-[14px] opacity-95">
            <i class="fa-solid fa-waveform"></i>
            <span>实时流量</span>
          </div>
          <div class="flex gap-[24px] text-[17px]">
            <div>
              <i class="fa-solid fa-arrow-up text-emerald-300 text-[13px]"></i>
              <span class="ml-[4px]">↑ {{ formatBytes(statistics.upload) }}/s</span>
            </div>
            <div>
              <i class="fa-solid fa-arrow-down text-emerald-300 text-[13px]"></i>
              <span class="ml-[4px]">↓ {{ formatBytes(statistics.download) }}/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="px-[32px] py-[32px]">
      <div class="flex justify-between items-center mb-[24px]">
        <!-- 启动/停止按钮 -->
        <div 
          class="bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] text-white px-[28px] py-[14px] rounded-[14px] text-[20px] font-semibold cursor-pointer transition-all hover:brightness-110"
          :class="{ 'bg-red-600 from-red-600 to-red-600': kernelApiStore.running }"
          v-loading="kernelApiStore.starting"
          @click="kernelApiStore.running ? handleStopKernel() : handleStartKernel()"
        >
          {{ kernelApiStore.running ? '停止VPN连接' : '开启VPN连接' }}
        </div>

        <!-- 更新按钮 -->
        <div 
          @click="handleUpdateSub(s)" 
          class="flex flex-col items-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-[14px] py-[8px] rounded-[12px] text-[13px] cursor-pointer transition-all"
        >
          <div class="flex items-center gap-[8px]">
            <i class="fa-solid fa-arrows-rotate"></i>
            更新
          </div>
          <div class="text-[10px] opacity-75 mt-[4px]">
            {{ s.updateTime ? formatDate(s.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-[1fr_1.6fr] gap-[60px]">
        <!-- 左侧：代理数量 -->
        <div>
          <div class="text-[#666] text-[14px] mb-[6px]">{{ t('subscribes.proxyCount') }}</div>
          <div class="text-[62px] font-bold text-[#6D28D9]">{{ s.proxies.length }}</div>
        </div>

        <!-- 右侧：流量数据 -->
        <div class="flex flex-col gap-[24px]">
          <div class="flex justify-between">
            <div>
              <div class="text-[#666] text-[14px]">上行流量</div>
              <div class="text-[19px] font-semibold mt-[4px]">
                {{ s.upload ? formatBytes(s.upload, 2) : '--' }}
              </div>
            </div>
            <div>
              <div class="text-[#666] text-[14px]">下行流量</div>
              <div class="text-[19px] font-semibold mt-[4px]">
                {{ s.download ? formatBytes(s.download, 2) : '--' }}
              </div>
            </div>
          </div>

          <div>
            <div class="text-[#666] text-[14px]">{{ t('subscribes.total') }}</div>
            <div class="text-[28px] font-bold text-[#6D28D9] mt-[4px]">
              ({{ formatBytes(s.download + s.upload, 2) }}) / 
              {{ s.total ? formatBytes(s.total, 2) : '--' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>