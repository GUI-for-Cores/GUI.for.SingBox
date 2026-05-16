<script setup lang="ts">
import { ref, h, inject, onMounted, onUnmounted } from 'vue'
// import { h, inject, ref } from 'vue'
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




//  onMounted(handleSave)

onMounted(() => {
  console.log('Component is mounted!2222')
  // 你的初始化逻辑
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

    //  console.log('status.value:',status.value);
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
  // unregisterMemoryHandler()
  unregisterTrafficHandler()
  // unregisterConnectionsHandler()
})
</script>

<template>


  <div class="main-card" v-for="s in subscribeStore.subscribes" :key="s.id">

    <!-- 顶部区域：标题 + 用户 + 实时流量 -->
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 28px; font-weight: 600;">欢迎来到 Z-VPN</h1>
          <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 18px; font-weight: 500;">{{ appSettingsStore.app.userInfo.userName }}</span>
            <span
              style="font-size: 13px; background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 9999px;">
              {{ t('subscribes.expire') }}:{{ s.expire ? formatDate(s.expire, 'YYYY-MM-DD HH:mm:ss') : '--' }}
              / 套餐流量：{{ formatBytes(s.download + s.upload,
                2) }}/ {{ s.total ?
                formatBytes(s.total, 2) : '--' }}
            </span>
          </div>
        </div>

        <!-- 实时流量 -->
        <div style="text-align: right;">
          <div
            style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 14px; opacity: 0.95;">
            <i class="fa-solid fa-waveform"></i>
            <span>实时流量</span>
          </div>
          <div style="display: flex; gap: 24px; font-size: 17px;">
            <div>
              <i class="fa-solid fa-arrow-up text-emerald-300" style="font-size: 13px;"></i>
              <span style="margin-left: 4px;">↑ {{ formatBytes(statistics.upload) }}/s </span>
            </div>
            <div>
              <i class="fa-solid fa-arrow-down text-emerald-300" style="font-size: 13px;"></i>
              <span style="margin-left: 4px;">↓ {{ formatBytes(statistics.download) }}/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div
          style="background: linear-gradient(to right, #6D28D9, #7C3AED); color: white; padding: 14px 28px; border-radius: 14px; font-size: 20px; font-weight: 600;">
          <div style="" v-show="!kernelApiStore.running" v-loading="kernelApiStore.starting" @click="handleStartKernel">
            开启VPN连接</div>
          <div style="background: red; color: white;" v-show="kernelApiStore.running"
            v-loading="kernelApiStore.starting" @click="handleStopKernel">停止VPN连接</div>
        </div>

        <!-- 更新按钮（带时间） -->
        <div @click="handleUpdateSub(s)" class="btn">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-arrows-rotate"></i>
            更新
          </div>
          <div style="font-size: 10px;">{{ s.updateTime ? formatDate(s.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 60px;">
        <!-- 左侧：代理数量 -->
        <div>
          <div style="color: #666; font-size: 14px; margin-bottom: 6px;">{{ t('subscribes.proxyCount') }}

          </div>
          <div style="font-size: 62px; font-weight: 700; color: #6D28D9;">{{ s.proxies.length }}</div>
        </div>

        <!-- 右侧：流量数据 -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div style="color: #666; font-size: 14px;">上行流量</div>
              <div style="font-size: 19px; font-weight: 600; margin-top: 4px;">{{ s.upload ? formatBytes(s.upload, 2) :
                '--' }}</div>
            </div>
            <div>
              <div style="color: #666; font-size: 14px;">下行流量</div>
              <div style="font-size: 19px; font-weight: 600; margin-top: 4px;">{{ s.download ? formatBytes(s.download,
                2) : '--' }}</div>
            </div>
          </div>

          <div>
            <div style="color: #666; font-size: 14px;">{{ t('subscribes.total') }}</div>
            <div style="font-size: 28px; font-weight: 700; color: #6D28D9; margin-top: 4px;">({{ formatBytes(s.download
              + s.upload,
              2) }})/{{ s.total ?
                formatBytes(s.total, 2) : '--' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>


</template>
<style lang="less" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, 'Microsoft YaHei', sans-serif;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  min-height: 100vh;
  padding: 40px 20px;
}

.main-card {
  // max-width: 900px;
  // margin: 0 auto;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
}

.header {
  background: linear-gradient(to right, #6D28D9, #7C3AED);
  color: white;
  padding: 24px 32px;
}

.content {
  padding: 32px;
}

.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* width: 110px; */
}

.btn:hover {
  background: #1d4ed8;
}

.btn small {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 4px;
}
</style>