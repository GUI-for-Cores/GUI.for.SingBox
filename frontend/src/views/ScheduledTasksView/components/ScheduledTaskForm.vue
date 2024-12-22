<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { deepClone, sampleID } from '@/utils'
import { ValidateCron } from '@/bridge/scheduledTasks'
import { ScheduledTaskOptions } from '@/constant/app'
import { ScheduledTasksType } from '@/enums/app'
import {
  type ScheduledTaskType,
  useScheduledTasksStore,
  useSubscribesStore,
  useRulesetsStore,
  usePluginsStore
} from '@/stores'

interface Props {
  id?: string
  isUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false
})

const loading = ref(false)

const task = ref<ScheduledTaskType>({
  id: sampleID(),
  name: '',
  type: ScheduledTasksType.RunScript,
  subscriptions: [],
  rulesets: [],
  plugins: [],
  script: '',
  cron: '',
  notification: false,
  disabled: false,
  lastTime: 0
})

const { t } = useI18n()
const { message } = useMessage()
const scheduledTasksStore = useScheduledTasksStore()
const subscribesStore = useSubscribesStore()
const rulesetsStore = useRulesetsStore()
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any

const handleSubmit = async () => {
  try {
    await ValidateCron(task.value.cron)
  } catch (error: any) {
    message.error(error)
    return
  }

  loading.value = true

  switch (task.value.type) {
    case ScheduledTasksType.UpdateSubscription:
      task.value.subscriptions = task.value.subscriptions.filter((id) =>
        subscribesStore.getSubscribeById(id)
      )
      break
    case ScheduledTasksType.UpdateRuleset:
      task.value.rulesets = task.value.rulesets.filter((id) => rulesetsStore.getRulesetById(id))
      break
    case ScheduledTasksType.UpdatePlugin:
    case ScheduledTasksType.RunPlugin:
      task.value.plugins = task.value.plugins.filter((id) => pluginsStore.getPluginById(id))
      break
  }

  try {
    if (props.isUpdate) {
      await scheduledTasksStore.editScheduledTask(props.id, task.value)
    } else {
      await scheduledTasksStore.addScheduledTask(task.value)
    }
    handleCancel()
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }

  loading.value = false
}

const handleUse = (list: string[], id: string) => {
  const idx = list.findIndex((v) => v === id)
  if (idx !== -1) {
    list.splice(idx, 1)
  } else {
    list.push(id)
  }
}

if (props.isUpdate) {
  const s = scheduledTasksStore.getScheduledTaskById(props.id)
  if (s) {
    task.value = deepClone(s)
  }
}
</script>

<template>
  <div class="form">
    <div class="form-item">
      <div class="name">{{ t('scheduledtask.name') }} *</div>
      <Input v-model="task.name" auto-size autofocus class="input" />
    </div>
    <div class="form-item">
      <div class="name">{{ t('scheduledtask.cron') }} *</div>
      <Input
        v-model="task.cron"
        :placeholder="t('scheduledtask.cronTips')"
        auto-size
        class="input"
      />
    </div>
    <div class="form-item">
      <div class="name" style="padding-right: 16px">{{ t('scheduledtask.type') }}</div>
      <Radio v-model="task.type" :options="ScheduledTaskOptions" />
    </div>
    <div class="form-item">
      <div class="name">{{ t('scheduledtask.notification') }}</div>
      <Switch v-model="task.notification" />
    </div>

    <div v-if="task.type === ScheduledTasksType.UpdateSubscription">
      <div class="name form-item-title">{{ t('scheduledtask.subscriptions') }}</div>
      <Empty v-if="subscribesStore.subscribes.length === 0" />
      <div class="task-list">
        <Card
          v-for="s in subscribesStore.subscribes"
          :key="s.id"
          :title="s.name"
          :selected="task.subscriptions.includes(s.id)"
          @click="handleUse(task.subscriptions, s.id)"
          class="task-list-item"
        >
          <div class="details">{{ s.type }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.UpdateRuleset">
      <div class="name form-item-title">{{ t('scheduledtask.rulesets') }}</div>
      <Empty v-if="rulesetsStore.rulesets.length === 0" />
      <div class="task-list">
        <Card
          v-for="r in rulesetsStore.rulesets"
          :key="r.id"
          :title="r.tag"
          :selected="task.rulesets.includes(r.id)"
          @click="handleUse(task.rulesets, r.id)"
          class="task-list-item"
        >
          <div class="details">{{ r.type }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.UpdatePlugin">
      <div class="name form-item-title">{{ t('scheduledtask.plugins') }}</div>
      <Empty v-if="pluginsStore.plugins.length === 0" />
      <div class="task-list">
        <Card
          v-for="p in pluginsStore.plugins"
          :key="p.id"
          :title="p.name"
          :selected="task.plugins.includes(p.id)"
          @click="handleUse(task.plugins, p.id)"
          class="task-list-item"
        >
          <div class="details">{{ p.type }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.RunPlugin">
      <div class="name form-item-title">{{ t('scheduledtask.plugins') }}</div>
      <Empty v-if="pluginsStore.plugins.length === 0" />
      <div class="task-list">
        <Card
          v-for="p in pluginsStore.plugins"
          v-tips="p.description"
          :key="p.id"
          :title="p.name"
          :selected="task.plugins.includes(p.id)"
          @click="handleUse(task.plugins, p.id)"
          class="task-list-item"
        >
          <div class="details">{{ p.description }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.RunScript">
      <div class="name form-item-title">{{ t('scheduledtask.script') }}</div>
      <CodeViewer v-model="task.script" editable lang="javascript" />
    </div>
  </div>

  <div class="form-action">
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button
      @click="handleSubmit"
      :loading="loading"
      :disabled="!task.name || !task.cron"
      type="primary"
    >
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.form {
  padding: 0 8px;
  overflow-y: auto;
  max-height: 70vh;
  .name {
    font-size: 14px;
    padding: 8px 0;
    white-space: nowrap;
  }
  .input {
    width: 80%;
  }
  .form-item-title {
    margin: 8px 4px;
  }
}

.task-list {
  display: flex;
  flex-wrap: wrap;
  &-item {
    margin: 4px;
    width: calc(33.333333% - 8px);
    .details {
      font-size: 12px;
      padding: 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
