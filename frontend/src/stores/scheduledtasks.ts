import { defineStore } from 'pinia'
import { stringify, parse } from 'yaml'
import { computed, ref, watch } from 'vue'

import { debounce } from '@/utils'
import { ScheduledTasksFilePath, ScheduledTasksType } from '@/constant'
import { useSubscribesStore, useRulesetsStore, usePluginsStore } from '@/stores'
import {
  Readfile,
  Writefile,
  AddScheduledTask,
  RemoveScheduledTask,
  EventsOn,
  EventsOff
} from '@/utils/bridge'

export type ScheduledTaskType = {
  id: string
  name: string
  type: ScheduledTasksType
  subscriptions: string[]
  rulesets: string[]
  plugins: string[]
  script: string
  cron: string
  disabled: boolean
  lastTime: string
}

export const useScheduledTasksStore = defineStore('scheduledtasks', () => {
  const scheduledtasks = ref<ScheduledTaskType[]>([])
  const ScheduledTasksEvents: string[] = []
  const ScheduledTasksIDs: number[] = []

  const setupScheduledTasks = async () => {
    const data = await Readfile(ScheduledTasksFilePath)
    scheduledtasks.value = parse(data)
  }

  const initScheduledTasks = async () => {
    removeScheduledTasks()

    scheduledtasks.value.forEach(async (task) => {
      if (task.disabled) return
      const taskID = await AddScheduledTask(task.cron, task.id)
      ScheduledTasksEvents.push(task.id)
      ScheduledTasksIDs.push(taskID)
      EventsOn(task.id, () => {
        task.lastTime = new Date().toLocaleString()
        editScheduledTask(task.id, task)
        getTaskFn(task.id)()
      })
    })
  }

  const removeScheduledTasks = () => {
    ScheduledTasksEvents.forEach((event) => EventsOff(event))
    ScheduledTasksIDs.forEach((id) => RemoveScheduledTask(id))
    ScheduledTasksEvents.splice(0)
    ScheduledTasksIDs.splice(0)
  }

  const getTaskFn = (id: string) => {
    const task = getScheduledTaskById(id)

    if (!task) return () => 0

    switch (task.type) {
      case ScheduledTasksType.UpdateSubscription: {
        const subscribesStore = useSubscribesStore()
        return async () => {
          for (const id of task.subscriptions) {
            await subscribesStore.updateSubscribe(id)
          }
        }
      }
      case ScheduledTasksType.UpdateRuleset: {
        const rulesetsStore = useRulesetsStore()
        return async () => {
          for (const id of task.rulesets) {
            await rulesetsStore.updateRuleset(id)
          }
        }
      }
      case ScheduledTasksType.UpdatePlugin: {
        const pluginsStores = usePluginsStore()
        return async () => {
          for (const id of task.plugins) {
            await pluginsStores.updatePlugin(id)
          }
        }
      }
      case ScheduledTasksType.RunPlugin: {
        const pluginsStores = usePluginsStore()
        return async () =>
          task.plugins.forEach((id) => {
            const plugin = pluginsStores.getPluginById(id)
            plugin && pluginsStores.manualTrigger(plugin, 'onTask' as any)
          })
      }
      case ScheduledTasksType.RunScript: {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        return new AsyncFunction(task.script)
      }
    }
  }

  const saveScheduledTasks = debounce(async () => {
    await Writefile(ScheduledTasksFilePath, stringify(scheduledtasks.value))
  }, 500)

  const addScheduledTask = async (s: ScheduledTaskType) => {
    scheduledtasks.value.push(s)
    try {
      await saveScheduledTasks()
    } catch (error) {
      scheduledtasks.value.pop()
      throw error
    }
  }

  const deleteScheduledTask = async (id: string) => {
    const idx = scheduledtasks.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = scheduledtasks.value.splice(idx, 1)[0]
    try {
      await saveScheduledTasks()
    } catch (error) {
      scheduledtasks.value.splice(idx, 0, backup)
      throw error
    }
  }

  const editScheduledTask = async (id: string, s: ScheduledTaskType) => {
    const idx = scheduledtasks.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = scheduledtasks.value.splice(idx, 1, s)[0]
    try {
      await saveScheduledTasks()
    } catch (error) {
      scheduledtasks.value.splice(idx, 1, backup)
      throw error
    }
  }

  const getScheduledTaskById = (id: string) => scheduledtasks.value.find((v) => v.id === id)

  const _watchCron = computed(() =>
    scheduledtasks.value
      .map((v) => v.cron)
      .sort()
      .join()
  )

  const _watchDisabled = computed(() =>
    scheduledtasks.value
      .map((v) => v.disabled)
      .sort()
      .join()
  )

  watch([_watchCron, _watchDisabled], () => {
    initScheduledTasks()
  })

  return {
    scheduledtasks,
    setupScheduledTasks,
    saveScheduledTasks,
    addScheduledTask,
    editScheduledTask,
    deleteScheduledTask,
    getScheduledTaskById,
    getTaskFn,
    removeScheduledTasks
  }
})
