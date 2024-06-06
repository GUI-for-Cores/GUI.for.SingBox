<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { View } from '@/constant'
import { useMessage, useBool } from '@/hooks'
import { DraggableOptions } from '@/constant'
import { debounce, formatRelativeTime, formatDate } from '@/utils'
import {
  type ScheduledTaskType,
  useAppSettingsStore,
  useScheduledTasksStore,
  type Menu
} from '@/stores'

import ScheduledTaskForm from './components/ScheduledTaskForm.vue'
import ScheduledTasksLogs from './components/ScheduledTasksLogs.vue'

const showTaskForm = ref(false)
const taskFormTaskID = ref()
const taskFormIsUpdate = ref(false)
const taskFormTitle = computed(() => (taskFormIsUpdate.value ? 'common.edit' : 'common.add'))

const menuList: Menu[] = [
  {
    label: 'scheduledtasks.run',
    handler: (id: string) => {
      scheduledTasksStore.runScheduledTask(id)
    }
  },
  {
    label: 'scheduledtasks.log',
    handler: (id: string) => {
      taskFormTaskID.value = id
      showLogs.value = true
    }
  }
]

const [showLogs, toggleLogs] = useBool(false)

const { t } = useI18n()
const { message } = useMessage()
const scheduledTasksStore = useScheduledTasksStore()
const appSettingsStore = useAppSettingsStore()

const handleAddTask = async () => {
  taskFormIsUpdate.value = false
  showTaskForm.value = true
}

const handleEditTask = (s: ScheduledTaskType) => {
  taskFormIsUpdate.value = true
  taskFormTaskID.value = s.id
  showTaskForm.value = true
}

const handleDeleteTask = async (s: ScheduledTaskType) => {
  try {
    await scheduledTasksStore.deleteScheduledTask(s.id)
  } catch (error: any) {
    console.error('deleteSubscribe: ', error)
    message.error(error)
  }
}

const handleDisableTask = async (s: ScheduledTaskType) => {
  s.disabled = !s.disabled
  scheduledTasksStore.editScheduledTask(s.id, s)
}

const handleViewLogs = () => {
  taskFormTaskID.value = ''
  toggleLogs()
}

const onSortUpdate = debounce(scheduledTasksStore.saveScheduledTasks, 1000)
</script>

<template>
  <div v-if="scheduledTasksStore.scheduledtasks.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="scheduledtasks.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddTask" type="link">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio
      v-model="appSettingsStore.app.scheduledtasksView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
    />
    <Button @click="handleViewLogs" type="text" class="ml-auto">
      {{ t('scheduledtasks.logs') }}
    </Button>
    <Button @click="handleAddTask" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[
      scheduledTasksStore.scheduledtasks,
      { ...DraggableOptions, onUpdate: onSortUpdate }
    ]"
    :class="'grid-list-' + appSettingsStore.app.scheduledtasksView"
  >
    <Card
      v-for="s in scheduledTasksStore.scheduledtasks"
      :key="s.id"
      :title="s.name"
      :disabled="s.disabled"
      v-menu="menuList.map((v) => ({ ...v, handler: () => v.handler?.(s.id) }))"
      class="item"
    >
      <template v-if="appSettingsStore.app.scheduledtasksView === View.Grid" #extra>
        <Dropdown :trigger="['hover', 'click']">
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <Button type="link" size="small" @click="handleDisableTask(s)">
              {{ s.disabled ? t('common.enable') : t('common.disable') }}
            </Button>
            <Button type="link" size="small" @click="handleEditTask(s)">
              {{ t('common.edit') }}
            </Button>
            <Button type="link" size="small" @click="handleDeleteTask(s)">
              {{ t('common.delete') }}
            </Button>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button type="link" size="small" @click="handleDisableTask(s)">
          {{ s.disabled ? t('common.enable') : t('common.disable') }}
        </Button>
        <Button type="link" size="small" @click="handleEditTask(s)">
          {{ t('common.edit') }}
        </Button>
        <Button type="link" size="small" @click="handleDeleteTask(s)">
          {{ t('common.delete') }}
        </Button>
      </template>
      <div>
        {{ t('scheduledtask.type') }}
        :
        {{ t('scheduledtask.' + s.type) }}
      </div>
      <div>
        {{ t('scheduledtask.cron') }}
        :
        {{ s.cron }}
      </div>
      <div v-if="appSettingsStore.app.scheduledtasksView === View.Grid">
        {{ t('scheduledtask.lastTime') }}
        :
        {{ s.lastTime ? formatRelativeTime(s.lastTime) : '--' }}
      </div>
      <div v-else>
        {{ t('scheduledtask.lastTime') }}
        :
        {{ s.lastTime ? formatDate(s.lastTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showTaskForm"
    :title="taskFormTitle"
    max-height="90"
    min-width="70"
    max-width="90"
    :footer="false"
  >
    <ScheduledTaskForm :is-update="taskFormIsUpdate" :id="taskFormTaskID" />
  </Modal>

  <Modal
    v-model:open="showLogs"
    :submit="false"
    mask-closable
    cancel-text="common.close"
    title="scheduledtasks.logs"
    width="90"
    height="90"
  >
    <ScheduledTasksLogs :id="taskFormTaskID" />
  </Modal>
</template>

<style lang="less" scoped></style>
