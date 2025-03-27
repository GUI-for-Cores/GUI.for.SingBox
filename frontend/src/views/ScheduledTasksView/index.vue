<script setup lang="ts">
import { h } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { View } from '@/enums/app'
import { DraggableOptions } from '@/constant/app'
import { debounce, formatRelativeTime, formatDate, message } from '@/utils'
import { type ScheduledTaskType, useAppSettingsStore, useScheduledTasksStore } from '@/stores'

import { useModal } from '@/components/Modal'
import ScheduledTaskForm from './components/ScheduledTaskForm.vue'
import ScheduledTasksLogs from './components/ScheduledTasksLogs.vue'

const menuList: Menu[] = [
  {
    label: 'scheduledtasks.run',
    handler: (id: string) => {
      scheduledTasksStore.runScheduledTask(id)
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
  modalApi
    .setProps({
      title: 'scheduledtasks.logs',
      cancelText: 'common.close',
      maskClosable: true,
      submit: false,
      width: '90',
      height: '90',
    })
    .setComponent(h(ScheduledTasksLogs, { id }))
    .open()
}

const handleShowTaskForm = (id?: string, isUpdate = false) => {
  modalApi
    .setProps({
      title: isUpdate ? 'common.edit' : 'common.add',
      maxHeight: '90',
      minWidth: '70',
      maxWidth: '90',
      submit: false,
      footer: false,
    })
    .setComponent(h(ScheduledTaskForm, { id, isUpdate }))
    .open()
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

const onSortUpdate = debounce(scheduledTasksStore.saveScheduledTasks, 1000)
</script>

<template>
  <div v-if="scheduledTasksStore.scheduledtasks.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="scheduledtasks.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleShowTaskForm()" type="link">{{ t('common.add') }}</Button>
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
        { label: 'common.list', value: View.List },
      ]"
    />
    <Button @click="handleShowTaskLogs()" type="text" class="ml-auto">
      {{ t('scheduledtasks.logs') }}
    </Button>
    <Button @click="handleShowTaskForm()" type="primary">
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
            <Button type="link" size="small" @click="handleShowTaskForm(s.id, true)">
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
        <Button type="link" size="small" @click="handleShowTaskForm(s.id, true)">
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

  <Modal />
</template>
