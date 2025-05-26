import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { message } from '@/utils'

type TaskLogType = {
  name: string
  startTime: number
  endTime: number
  result: string[]
}

export const useLogsStore = defineStore('logs', () => {
  const kernelLogs = ref<string[]>([])
  const scheduledtasksLogs = ref<TaskLogType[]>([])

  const recordKernelLog = (msg: string) => {
    msg.includes('FATAL') && message.error(msg)
    kernelLogs.value.unshift(msg)
  }

  const recordScheduledTasksLog = (log: TaskLogType) => scheduledtasksLogs.value.unshift(log)

  const isTasksLogEmpty = computed(() => scheduledtasksLogs.value.length === 0)

  const isEmpty = computed(() => kernelLogs.value.length === 0)

  const clearKernelLog = () => kernelLogs.value.splice(0)

  return {
    recordKernelLog,
    clearKernelLog,
    kernelLogs,
    isEmpty,
    scheduledtasksLogs,
    isTasksLogEmpty,
    recordScheduledTasksLog,
  }
})
