import { Cron } from 'croner'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parse } from 'yaml'

import { ReadFile, WriteFile, Notify } from '@/bridge'
import { ScheduledTasksFilePath } from '@/constant/app'
import { ScheduledTasksType, PluginTriggerEvent } from '@/enums/app'
import { useSubscribesStore, useRulesetsStore, usePluginsStore, useLogsStore } from '@/stores'
import { ignoredError, stringifyNoFolding } from '@/utils'

import type { ScheduledTask } from '@/types/app'

export const useScheduledTasksStore = defineStore('scheduledtasks', () => {
  const scheduledtasks = ref<ScheduledTask[]>([])
  const cronJobsMap: Recordable<Cron> = {}

  const setupScheduledTasks = async () => {
    const data = await ignoredError(ReadFile, ScheduledTasksFilePath)
    data && (scheduledtasks.value = parse(data))

    scheduledtasks.value.forEach(async ({ disabled, cron, id }) => {
      if (!disabled) {
        cronJobsMap[id] = new Cron(cron, () => runScheduledTask(id))
      }
    })
  }

  const runScheduledTask = async (id: string) => {
    const task = getScheduledTaskById(id)
    if (!task) return

    const logsStore = useLogsStore()

    task.lastTime = Date.now()
    editScheduledTask(id, task)

    const startTime = Date.now()
    const result = await getTaskFn(task)()

    task.notification && Notify(task.name, result.join('\n'))

    logsStore.recordScheduledTasksLog({
      name: task.name,
      startTime,
      endTime: Date.now(),
      result,
    })
  }

  const withOutput = (list: string[], fn: (id: string) => Promise<string>) => {
    return async () => {
      const output: string[] = []
      for (const id of list) {
        try {
          const res = await fn(id)
          output.push(res)
        } catch (error: any) {
          output.push(error.message || error)
        }
      }
      return output
    }
  }

  const getTaskFn = (task: ScheduledTask) => {
    switch (task.type) {
      case ScheduledTasksType.UpdateSubscription: {
        const subscribesStore = useSubscribesStore()
        return withOutput(task.subscriptions, subscribesStore.updateSubscribe)
      }
      case ScheduledTasksType.UpdateRuleset: {
        const rulesetsStore = useRulesetsStore()
        return withOutput(task.rulesets, rulesetsStore.updateRuleset)
      }
      case ScheduledTasksType.UpdatePlugin: {
        const pluginsStores = usePluginsStore()
        return withOutput(task.plugins, pluginsStores.updatePlugin)
      }
      case ScheduledTasksType.RunPlugin: {
        const pluginsStores = usePluginsStore()
        return withOutput(task.plugins, async (id: string) =>
          pluginsStores.manualTrigger(id, PluginTriggerEvent.OnTask),
        )
      }
      case ScheduledTasksType.RunScript: {
        return withOutput([task.script], (script: string) => new window.AsyncFunction(script)())
      }
    }
  }

  const saveScheduledTasks = () => {
    return WriteFile(ScheduledTasksFilePath, stringifyNoFolding(scheduledtasks.value))
  }

  const addScheduledTask = async (s: ScheduledTask) => {
    scheduledtasks.value.push(s)
    try {
      cronJobsMap[s.id] = new Cron(s.cron, () => runScheduledTask(s.id))
      await saveScheduledTasks()
    } catch (error) {
      cronJobsMap[s.id]?.stop()
      delete cronJobsMap[s.id]
      const idx = scheduledtasks.value.indexOf(s)
      if (idx !== -1) {
        scheduledtasks.value.splice(idx, 1)
      }
      throw error
    }
  }

  const deleteScheduledTask = async (id: string) => {
    const idx = scheduledtasks.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = scheduledtasks.value.splice(idx, 1)[0]
    try {
      await saveScheduledTasks()
      cronJobsMap[id]?.stop()
      delete cronJobsMap[id]
    } catch (error) {
      scheduledtasks.value.splice(idx, 0, backup)
      throw error
    }
  }

  const editScheduledTask = async (id: string, s: ScheduledTask) => {
    const idx = scheduledtasks.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = scheduledtasks.value.splice(idx, 1, s)[0]
    try {
      await saveScheduledTasks()
      cronJobsMap[id]?.stop()
      if (s.disabled) {
        delete cronJobsMap[id]
      } else {
        cronJobsMap[id] = new Cron(s.cron, () => runScheduledTask(id))
      }
    } catch (error) {
      scheduledtasks.value.splice(idx, 1, backup)
      throw error
    }
  }

  const getScheduledTaskById = (id: string) => scheduledtasks.value.find((v) => v.id === id)

  return {
    scheduledtasks,
    setupScheduledTasks,
    saveScheduledTasks,
    addScheduledTask,
    editScheduledTask,
    deleteScheduledTask,
    getScheduledTaskById,
    getTaskFn,
    runScheduledTask,
  }
})
