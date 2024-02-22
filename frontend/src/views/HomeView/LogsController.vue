<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ref, computed, onUnmounted } from 'vue'

import { useBool } from '@/hooks'
import { LogLevelOptions } from '@/constant'
import { getKernelLogsWS } from '@/api/kernel'

const logType = ref('info')
const keywords = ref('')
const logs = ref<{ type: string; payload: string }[]>([])
const keywordsRegexp = computed(() => new RegExp(keywords.value))

const LogLevelMap: Record<string, string[]> = {
  panic: ['silent'],
  error: ['error'],
  warn: ['error', 'warn'],
  info: ['error', 'warn', 'info'],
  debug: ['error', 'warn', 'info', 'debug']
}

const filteredLogs = computed(() => {
  return logs.value.filter((v) => {
    const hitType = LogLevelMap[logType.value].includes(v.type)
    const hitName = keywordsRegexp.value.test(v.payload)
    return hitName && hitType
  })
})

const { t } = useI18n()
const [pause, togglePause] = useBool(false)

const handleClear = () => logs.value.splice(0)

const onLogs = (data: any) => {
  pause.value || logs.value.unshift(data)
}

const disconnect = getKernelLogsWS(onLogs)

onUnmounted(disconnect)
</script>

<template>
  <div class="logs-view">
    <div class="form">
      <span class="label">
        {{ t('kernel.log-level') }}
        :
      </span>
      <Select v-model="logType" :options="LogLevelOptions" size="small" />
      <Input
        v-model="keywords"
        size="small"
        :placeholder="t('common.keywords')"
        class="ml-8 flex-1"
      />
      <Button @click="togglePause" type="text" size="small" class="ml-8">
        <Icon :icon="pause ? 'play' : 'pause'" fill="var(--color)" />
      </Button>
      <Button @click="handleClear" v-tips="'common.clear'" size="small" type="text">
        <Icon icon="clear" fill="var(--color)" />
      </Button>
    </div>

    <Empty v-if="filteredLogs.length === 0" class="flex-1" />

    <div v-else class="logs">
      <div
        v-for="(log, i) in filteredLogs"
        :key="i"
        class="log select-text"
      >
        <span class="type">{{ log.type }}</span> {{ log.payload }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.logs-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logs {
  margin-top: 8px;
  flex: 1;
  overflow-y: auto;

  .log {
    font-size: 12px;
    padding: 2px 4px;
    margin: 4px 0;
    background: var(--card-bg);
    &:hover {
      color: #fff;
      background: var(--primary-color);
      .type {
        color: #fff;
      }
    }
  }
}

.form {
  position: sticky;
  top: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  background-color: var(--modal-bg);
  backdrop-filter: blur(2px);
  .label {
    padding: 0 8px;
    font-size: 12px;
  }
}

.type {
  display: inline-block;
  width: 50px;
  text-align: center;
  color: var(--primary-color);
}
</style>
