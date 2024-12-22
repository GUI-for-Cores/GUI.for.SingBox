<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ref, computed, onUnmounted } from 'vue'

import { useBool, useMessage, usePicker } from '@/hooks'
import { type PickerItem } from '@/components/Picker/index.vue'
import { LogLevelOptions } from '@/constant/kernel'
import { getKernelLogsWS } from '@/api/kernel'
import { addToRuleSet, isValidIPv4, isValidIPv6, setIntervalImmediately } from '@/utils'

const logType = ref('info')
const keywords = ref('')
const logs = ref<{ type: string; payload: string }[]>([])
const keywordsRegexp = computed(() => new RegExp(keywords.value))

const LogLevelMap: Record<string, string[]> = {
  trace: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic'],
  debug: ['debug', 'info', 'warn', 'error', 'fatal', 'panic'],
  info: ['info', 'warn', 'error', 'fatal', 'panic'],
  warn: ['warn', 'error', 'fatal', 'panic'],
  error: ['error', 'fatal', 'panic'],
  fatal: ['fatal', 'panic'],
  panic: ['panic']
}

const filteredLogs = computed(() => {
  return logs.value.filter((v) => {
    const hitType = LogLevelMap[logType.value].includes(v.type)
    const hitName = keywordsRegexp.value.test(v.payload)
    return hitName && hitType
  })
})

const menus: Menu[] = [
  ['home.connections.addToDirect', 'direct'],
  ['home.connections.addToProxy', 'proxy'],
  ['home.connections.addToReject', 'reject']
].map(([label, ruleset]) => {
  return {
    label,
    handler: async ({ type, payload }: any) => {
      if (type !== 'info') {
        message.error('Not Support')
        return
      }
      const regex = /(\b((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(:\d+)?\b)/g
      const matches = payload.match(regex)
      if (!matches) {
        message.error('Not Matched')
        return
      }

      const options: PickerItem[] = []

      matches.forEach((match: string) => {
        // FIXME: IPv6
        const address = match.split(':')[0]
        if (isValidIPv4(address) || isValidIPv6(address)) {
          options.push({
            label: t('kernel.rules.type.IP-CIDR'),
            value: { ip_cidr: address + '/32' } as any,
            description: address
          })
        } else {
          options.push({
            label: t('kernel.rules.type.DOMAIN'),
            value: { domain: address } as any,
            description: address
          })
        }
      })

      const payloads = await picker.multi<Record<string, any>[]>('rulesets.selectRuleType', options)

      try {
        await addToRuleSet(ruleset as any, payloads)
        message.success('common.success')
      } catch (error: any) {
        message.error(error)
        console.log(error)
      }
    }
  }
})

const { t } = useI18n()
const { message } = useMessage()
const { picker } = usePicker()
const [pause, togglePause] = useBool(false)

const handleClear = () => logs.value.splice(0)

const onLogs = (data: any) => {
  pause.value || logs.value.unshift(data)
}

const { connect, disconnect } = getKernelLogsWS(onLogs)
const timer = setIntervalImmediately(connect, 1000)

onUnmounted(() => {
  clearInterval(timer)
  disconnect()
})
</script>

<template>
  <div class="logs-view">
    <div class="form">
      <span class="label">
        {{ t('kernel.log.level') }}
        :
      </span>
      <Select v-model="logType" :options="LogLevelOptions" size="small" />
      <Input
        v-model="keywords"
        clearable
        auto-size
        size="small"
        :placeholder="t('common.keywords')"
        class="ml-8 flex-1"
      />
      <Button
        @click="togglePause"
        :icon="pause ? 'play' : 'pause'"
        type="text"
        size="small"
        class="ml-8"
      />
      <Button @click="handleClear" v-tips="'common.clear'" icon="clear" size="small" type="text" />
    </div>

    <Empty v-if="filteredLogs.length === 0" class="flex-1" />

    <div v-else class="logs">
      <div
        v-for="log in filteredLogs"
        v-menu="menus.map((v) => ({ ...v, handler: () => v.handler?.(log) }))"
        :key="log.payload"
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
  display: flex;
  align-items: center;
  .label {
    padding-right: 8px;
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
