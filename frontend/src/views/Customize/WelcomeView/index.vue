<script setup lang="ts">
import { computed, h, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NCard, NDataTable, NModal, NTag, type DataTableColumns } from 'naive-ui'
import { useAppSettingsStore, useKernelApiStore, useSubscribesStore } from '@/stores'
import { formatBytes, formatDate, message } from '@/utils'
import type { Subscription } from '@/types/app'

type ProxyItem = Subscription['proxies'][number]

const kernelApiStore = useKernelApiStore()
const appSettingsStore = useAppSettingsStore()
const subscribeStore = useSubscribesStore()
const { t } = useI18n()
const router = useRouter()

const showLogoutConfirm = ref(false)
const statistics = ref({
  upload: 0,
  download: 0,
})

const userName = computed(() => appSettingsStore.app.userInfo.userName || '用户')

const proxyColumns: DataTableColumns<ProxyItem> = [
  {
    title: '节点',
    key: 'tag',
    ellipsis: {
      tooltip: true,
    },
    render(row) {
      return h('span', { class: 'font-medium text-#1f2937' }, row.tag || row.id || '--')
    },
  },
  {
    title: '协议',
    key: 'type',
    width: 120,
    render(row) {
      return h(
        NTag,
        {
          size: 'small',
          type: getProxyTagType(row.type),
          round: true,
        },
        { default: () => row.type || 'Unknown' },
      )
    },
  },
]

const unregisterTrafficHandler = kernelApiStore.onTraffic((data) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down
})

onUnmounted(() => {
  unregisterTrafficHandler()
})

const getProxyTagType = (type: string) => {
  const normalizedType = type?.toLowerCase()

  if (['hysteria', 'hysteria2', 'tuic'].includes(normalizedType)) {
    return 'success'
  }

  if (['vmess', 'vless', 'trojan'].includes(normalizedType)) {
    return 'info'
  }

  if (['shadowsocks', 'ss'].includes(normalizedType)) {
    return 'warning'
  }

  return 'default'
}

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
    message.error(error.message || error)
  }
}

const handleToggleKernel = () => {
  if (kernelApiStore.running) {
    handleStopKernel()
    return
  }

  handleStartKernel()
}

const handleUpdateSub = async (s: Subscription) => {
  try {
    await subscribeStore.updateSubscribe(s.id)
  } catch (error: any) {
    console.error('updateSubscribe: ', error)
    message.error(error)
  }
}

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const handleConfirmLogout = () => {
  showLogoutConfirm.value = false
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="p-24px">
    <n-card
      v-for="s in subscribeStore.subscribes"
      :key="s.id"
      :bordered="false"
      class="mb-32px overflow-hidden rounded-20px shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]"
      content-class="p-0!"
    >
      <div class="bg-gradient-to-r from-#6D28D9 to-#18a058 px-32px py-24px text-white ">
        <div class="flex flex-col gap-18px md:flex-row md:items-start md:justify-between">
          <div>
            <h1 class="m-0 text-28px font-semibold">欢迎来到 Z-VPN</h1>
            <div class="mt-12px flex flex-wrap items-center gap-12px">
              <span class="text-18px font-medium">{{ userName }}</span>
              <span class="rounded-full bg-white/25 px-12px py-4px text-13px">
                {{ t('subscribes.expire') }}：{{ s.expire ? formatDate(s.expire, 'YYYY-MM-DD HH:mm:ss') : '--' }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-14px text-left md:items-end md:text-right">
            <n-button
              secondary
              type="primary"
              size="small"
              class="rounded-12px bg-white/18 px-14px text-white hover:bg-white/28"
              @click="handleLogout"
            >
              退出登录
            </n-button>

            <div>
             
              <div class="flex gap-24px text-17px">
                   <span>实时流量 ：</span>
                <span>↑ {{ formatBytes(statistics.upload) }}/s</span>
                <span>↓ {{ formatBytes(statistics.download) }}/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-32px py-32px">
        <div class="mb-24px flex flex-col gap-14px md:flex-row md:items-center md:justify-between">
          <n-button
            :type="kernelApiStore.running ? 'error' : 'primary'"
            size="large"
            :loading="kernelApiStore.starting"
            class="h-50px rounded-14px px-28px text-18px font-semibold"
            @click="handleToggleKernel"
          >
            {{ kernelApiStore.running ? '停止 VPN 连接' : '开启 VPN 连接' }}
          </n-button>

          <n-button
            secondary
            type="primary"
            :loading="s.updating"
            class="h-40px rounded-12px px-16px"
            @click="handleUpdateSub(s)"
          >
            更新订阅
            <span class="ml-8px text-11px opacity-70">
              {{ s.updateTime ? formatDate(s.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
            </span>
          </n-button>
        </div>

        <div class="grid grid-cols-1 gap-32px lg:grid-cols-[1fr_1.6fr]">
          <div>
            <div class="mb-6px text-14px text-#666">{{ t('subscribes.proxyCount') }}</div>
            <div class="text-62px font-bold leading-none text-#6D28D9">{{ s.proxies.length }}</div>
          </div>

          <div class="flex flex-col gap-24px">
            <div class="flex flex-wrap gap-36px">
              <div>
                <div class="text-14px text-#666">上行流量</div>
                <div class="mt-4px text-19px font-semibold">{{ s.upload ? formatBytes(s.upload, 2) : '--' }}</div>
              </div>
              <div>
                <div class="text-14px text-#666">下行流量</div>
                <div class="mt-4px text-19px font-semibold">{{ s.download ? formatBytes(s.download, 2) : '--' }}</div>
              </div>
            </div>

            <div>
              <div class="text-14px text-#666">{{ t('subscribes.total') }}</div>
              <div class="mt-4px text-28px font-bold text-#6D28D9">
                {{ formatBytes(s.download + s.upload, 2) }} /
                {{ s.total ? formatBytes(s.total, 2) : '--' }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-30px border-t border-#eef2f7 pt-22px">
          <div class="mb-12px flex items-center justify-between">
            <div class="text-16px font-semibold text-#1f2937">代理列表</div>
            <n-tag size="small" round>{{ s.proxies.length }} 个节点</n-tag>
          </div>
          <n-data-table
            :columns="proxyColumns"
            :data="s.proxies"
            :row-key="(row: ProxyItem) => row.id"
            :pagination="{ pageSize: 6 }"
            size="small"
          />
        </div>
      </div>
    </n-card>

    <n-card v-if="!subscribeStore.subscribes.length" :bordered="false" class="rounded-20px text-center">
      <div class="py-42px text-#666">暂无订阅，请先登录或添加订阅。</div>
                <n-button
            secondary
            type="primary"
           
            class="h-40px rounded-12px px-16px"
            @click="handleConfirmLogout"
          >返回 </n-button>
    </n-card>

    <n-modal
      v-model:show="showLogoutConfirm"
      preset="dialog"
      title="提示"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleConfirmLogout"
    >
      是否退出登录
    </n-modal>
  </div>
</template>
