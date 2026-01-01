<script setup lang="ts">
import { Cron } from 'croner'
import { useI18n, I18nT } from 'vue-i18n'

import { DraggableOptions, ViewOptions } from '@/constant/app'
import { View } from '@/enums/app'
import { useAppSettingsStore, useScheduledTasksStore } from '@/stores'
import { debounce, formatRelativeTime, formatDate, message, alert } from '@/utils'

import { useModal } from '@/components/Modal'

import ScheduledTaskForm from './components/ScheduledTaskForm.vue'
import ScheduledTasksLogs from './components/ScheduledTasksLogs.vue'

import type { Menu, ScheduledTask } from '@/types/app'

const menuList: Menu[] = [
  {
    label: 'scheduledtasks.run',
    handler: (id: string) => {
      scheduledTasksStore.runScheduledTask(id)
    },
  },
  {
    label: 'scheduledtasks.next',
    handler: (id: string) => {
      const task = scheduledTasksStore.getScheduledTaskById(id)
      if (task) {
        const list = new Cron(task.cron).nextRuns(99).map((v, i) => {
          const index = (i + 1).toString().padStart(2, '0')
          return index + ' - '.repeat(14) + formatDate(v.getTime(), 'YYYY/MM/DD HH:mm:ss')
        })
        alert('Next Run Time', list.join('\n'))
      }
    },
  },
  {
    label: 'scheduledtasks.log',
    handler: (id: string) => {
      handleShowTaskLogs(id)
    },
  },
]

const { t } = useI18n()
const [Modal, modalApi] = useModal({})
const scheduledTasksStore = useScheduledTasksStore()
const appSettingsStore = useAppSettingsStore()

const handleShowTaskLogs = (id?: string) => {
  modalApi.setProps({
    title: 'scheduledtasks.logs',
    cancelText: 'common.close',
    maskClosable: true,
    submit: false,
    width: '90',
    height: '90',
  })
  modalApi.setContent(ScheduledTasksLogs, { id }).open()
}

const handleShowTaskForm = (id?: string) => {
  modalApi.setProps({
    title: id ? 'common.edit' : 'common.add',
    maxHeight: '90',
    minWidth: '70',
    maxWidth: '90',
  })
  modalApi.setContent(ScheduledTaskForm, { id }).open()
}

const handleDeleteTask = async (s: ScheduledTask) => {
  try {
    await scheduledTasksStore.deleteScheduledTask(s.id)
  } catch (error: any) {
    console.error('deleteSubscribe: ', error)
    message.error(error)
  }
}

const handleDisableTask = async (s: ScheduledTask) => {
  s.disabled = !s.disabled
  scheduledTasksStore.editScheduledTask(s.id, s)
}

const onSortUpdate = debounce(scheduledTasksStore.saveScheduledTasks, 1000)
</script>

<template>
  <div v-if="scheduledTasksStore.scheduledtasks.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT
          keypath="scheduledtasks.empty"
          tag="div"
          scope="global"
          class="flex items-center mt-12"
        >
          <template #action>
            <Button type="link" @click="handleShowTaskForm()">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio
      v-model="appSettingsStore.app.scheduledtasksView"
      :options="ViewOptions"
      class="mr-auto"
    />
    <Button type="text" @click="handleShowTaskLogs()">
      {{ t('scheduledtasks.logs') }}
    </Button>
    <Button type="primary" icon="add" class="ml-16" @click="handleShowTaskForm()">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[
      scheduledTasksStore.scheduledtasks,
      { ...DraggableOptions, onUpdate: onSortUpdate },
    ]"
    :class="'grid-list-' + appSettingsStore.app.scheduledtasksView"
  >
    <Card
      v-for="s in scheduledTasksStore.scheduledtasks"
      :key="s.id"
      v-menu="menuList.map((v) => ({ ...v, handler: () => v.handler?.(s.id) }))"
      :title="s.name"
      :disabled="s.disabled"
      class="grid-list-item"
    >
      <template v-if="appSettingsStore.app.scheduledtasksView === View.Grid" #extra>
        <Dropdown>
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <Button type="text" @click="handleDisableTask(s)">
                {{ s.disabled ? t('common.enable') : t('common.disable') }}
              </Button>
              <Button type="text" @click="handleShowTaskForm(s.id)">
                {{ t('common.edit') }}
              </Button>
              <Button type="text" @click="handleDeleteTask(s)">
                {{ t('common.delete') }}
              </Button>
            </div>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button type="text" size="small" @click="handleDisableTask(s)">
          {{ s.disabled ? t('common.enable') : t('common.disable') }}
        </Button>
        <Button type="text" size="small" @click="handleShowTaskForm(s.id)">
          {{ t('common.edit') }}
        </Button>
        <Button type="text" size="small" @click="handleDeleteTask(s)">
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

  <Modal />
</template>
