import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMessage } from '@/hooks'

const MAX_LINES = 9000

type TaskLogType = {
  name: string
  startTime: number
  endTime: number
  result: string[]
}

export const useLogsStore = defineStore('logs', () => {
  const kernelLogs = ref<string[]>([])
  const scheduledtasksLogs = ref<TaskLogType[]>([])
  const { message } = useMessage()

  const regExp = /\+0800 \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} (.*)/
  const recordKernelLog = (msg: string) => {
    msg.includes('FATAL') && message.error(msg)
    const match = regExp.exec(msg)
    kernelLogs.value.unshift((match && match[1]) || msg)
    if (kernelLogs.value.length > MAX_LINES) {
      kernelLogs.value.pop()
    }
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
