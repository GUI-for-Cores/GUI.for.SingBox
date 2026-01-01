<script lang="ts" setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { LogLevelOptions } from '@/constant/kernel'
import { useBool } from '@/hooks'
import { useKernelApiStore } from '@/stores'
import { addToRuleSet, buildSmartRegExp, isValidIPv4, isValidIPv6, message, picker } from '@/utils'

import type { PickerItem } from '@/components/Picker/index.vue'
import type { Menu } from '@/types/app'

const logType = ref<'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic'>('info')
const keywords = ref('')
const logs = ref<{ type: string; payload: string }[]>([])

const LogLevelMap = {
  trace: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic'],
  debug: ['debug', 'info', 'warn', 'error', 'fatal', 'panic'],
  info: ['info', 'warn', 'error', 'fatal', 'panic'],
  warn: ['warn', 'error', 'fatal', 'panic'],
  error: ['error', 'fatal', 'panic'],
  fatal: ['fatal', 'panic'],
  panic: ['panic'],
}

const filteredLogs = computed(() => {
  return logs.value.filter((v) => {
    const hitType = LogLevelMap[logType.value].includes(v.type)
    const hitName = buildSmartRegExp(keywords.value, 'i').test(v.payload)
    return hitName && hitType
  })
})

const menus: Menu[] = (
  [
    ['home.connections.addToDirect', 'direct'],
    ['home.connections.addToProxy', 'proxy'],
    ['home.connections.addToReject', 'reject'],
  ] as const
).map(([label, ruleset]) => {
  return {
    label,
    handler: async ({ type, payload }) => {
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

      const options: PickerItem<Record<string, any>[]>[] = []

      matches.forEach((match: string) => {
        // FIXME: IPv6
        const address = match.split(':')[0]
        if (!address) return
        if (isValidIPv4(address) || isValidIPv6(address)) {
          options.push({
            label: t('kernel.rules.type.ip_cidr'),
            value: { ip_cidr: address + '/32' } as any,
            description: address,
          })
        } else {
          options.push({
            label: t('kernel.rules.type.domain'),
            value: { domain: address } as any,
            description: address,
          })
        }
      })

      const payloads = await picker.multi('rulesets.selectRuleType', options)

      try {
        await addToRuleSet(ruleset, payloads)
        message.success('common.success')
      } catch (error: any) {
        message.error(error)
        console.log(error)
      }
    },
  }
})

const { t } = useI18n()
const [pause, togglePause] = useBool(false)
const kernelApiStore = useKernelApiStore()

const handleClear = () => logs.value.splice(0)

const unregisterLogsHandler = kernelApiStore.onLogs((data) => {
  pause.value || logs.value.unshift(data)
})

onUnmounted(() => {
  unregisterLogsHandler()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center">
      <span class="text-12 pr-8">
        {{ t('kernel.log.level') }}
        :
      </span>
      <Select v-model="logType" :options="LogLevelOptions" size="small" />
      <Input
        v-model="keywords"
        clearable
        size="small"
        :placeholder="t('common.keywords')"
        class="ml-8 flex-1"
      />
      <Button
        :icon="pause ? 'play' : 'pause'"
        type="text"
        size="small"
        class="ml-8"
        @click="togglePause"
      />
      <Button v-tips="'common.clear'" icon="clear" size="small" type="text" @click="handleClear" />
    </div>

    <Empty v-if="filteredLogs.length === 0" />

    <div v-else class="mt-8 overflow-y-auto">
      <div
        v-for="log in filteredLogs"
        :key="log.payload"
        v-menu="menus.map((v) => ({ ...v, handler: () => v.handler?.(log) }))"
        class="log select-text text-12 py-2 px-4 my-4"
      >
        <span class="type inline-block text-center">{{ log.type }}</span> {{ log.payload }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.log {
  background: var(--card-bg);
  &:hover {
    color: #fff;
    background: var(--primary-color);
    .type {
      color: #fff;
    }
  }
}

.type {
  width: 50px;
  color: var(--primary-color);
}
</style>
