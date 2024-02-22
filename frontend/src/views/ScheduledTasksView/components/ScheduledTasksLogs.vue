<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLogsStore, useScheduledTasksStore } from '@/stores'

import type { Column } from '@/components/Table/index.vue'

const { t } = useI18n()
const logsStore = useLogsStore()
const pluginsStore = useScheduledTasksStore()

const plugin = ref('')
const keywords = ref('')

const columns: Column[] = [
  {
    title: 'scheduledtasks.name',
    align: 'center',
    key: 'name'
  },
  {
    title: 'scheduledtasks.startTime',
    align: 'center',
    key: 'startTime',
    customRender: ({ value }) => new Date(value).toLocaleString()
  },
  {
    title: 'scheduledtasks.endTime',
    align: 'center',
    key: 'endTime',
    customRender: ({ value }) => new Date(value).toLocaleString()
  },
  {
    title: 'scheduledtasks.duration',
    align: 'center',
    key: 'endTime',
    sort: (a, b) => b.endTime - b.startTime - (a.endTime - a.startTime),
    customRender: ({ value, record }) => {
      return ((value - record.startTime) / 1000).toFixed(2) + 's'
    }
  },
  {
    title: 'scheduledtasks.result',
    key: 'result'
  }
]

const pluginsOptions = computed(() =>
  [{ label: 'All', value: '' }].concat(
    ...pluginsStore.scheduledtasks.map((v) => ({
      label: v.name,
      value: v.name
    }))
  )
)

const filteredLogs = computed(() => {
  return logsStore.scheduledtasksLogs.filter((v) => {
    const p = plugin.value ? v.name === plugin.value : true
    const k = v.result.some((vv) => (vv ? vv.includes(keywords.value) : true))
    return p && k
  })
})

const clearLogs = () => logsStore.scheduledtasksLogs.splice(0)
</script>

<template>
  <div class="logs">
    <div class="form">
      <span class="label">
        {{ t('scheduledtasks.name') }}
        :
      </span>
      <Select v-model="plugin" :options="pluginsOptions" size="small" />
      <Input
        v-model="keywords"
        size="small"
        :placeholder="t('common.keywords')"
        class="ml-8 flex-1"
      />
      <Button @click="clearLogs" v-tips="'common.clear'" size="small" type="text" class="ml-8">
        <Icon icon="clear" fill="var(--color)" />
      </Button>
    </div>

    <Empty v-if="logsStore.scheduledtasksLogs.length === 0" class="flex-1" />

    <Table v-else :columns="columns" :data-source="filteredLogs" sort="start" class="mt-8" />
  </div>
</template>

<style lang="less" scoped>
.logs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form {
  display: flex;
  align-items: center;
  .label {
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>
