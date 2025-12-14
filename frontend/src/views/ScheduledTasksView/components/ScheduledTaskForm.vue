<script setup lang="ts">
import { ref, inject, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { ScheduledTaskOptions } from '@/constant/app'
import { ScheduledTasksType } from '@/enums/app'
import {
  useScheduledTasksStore,
  useSubscribesStore,
  useRulesetsStore,
  usePluginsStore,
} from '@/stores'
import { alert, deepClone, formatDate, isValidCron, message, sampleID } from '@/utils'

import Button from '@/components/Button/index.vue'

import type { ScheduledTask } from '@/types/app'

interface Props {
  id?: string
}

const props = defineProps<Props>()

const loading = ref(false)

const task = ref<ScheduledTask>({
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
  lastTime: 0,
})

const { t } = useI18n()
const scheduledTasksStore = useScheduledTasksStore()
const subscribesStore = useSubscribesStore()
const rulesetsStore = useRulesetsStore()
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  const { ok, reason } = isValidCron(task.value.cron)
  if (!ok) {
    message.error(reason)
    return
  }

  switch (task.value.type) {
    case ScheduledTasksType.UpdateSubscription:
      task.value.subscriptions = task.value.subscriptions.filter((id) =>
        subscribesStore.getSubscribeById(id),
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

  loading.value = true

  try {
    if (props.id) {
      await scheduledTasksStore.editScheduledTask(props.id, task.value)
    } else {
      await scheduledTasksStore.addScheduledTask(task.value)
    }
    await handleSubmit()
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

const handleValidate = () => {
  const { ok, reason } = isValidCron(task.value.cron)
  if (!ok) {
    message.error(reason)
    return
  }
  message.success('common.success')
}

const handleViewNextRuns = () => {
  const { ok, reason, instance } = isValidCron(task.value.cron)
  if (!ok) {
    message.error(reason)
    return
  }
  const list = instance!.nextRuns(99).map((v, i) => {
    const index = (i + 1).toString().padStart(2, '0')
    return index + ' - '.repeat(14) + formatDate(v.getTime(), 'YYYY/MM/DD HH:mm:ss')
  })
  alert('Next Run Time', list.join('\n'))
}

if (props.id) {
  const s = scheduledTasksStore.getScheduledTaskById(props.id)
  if (s) {
    task.value = deepClone(s)
  }
}

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        disabled: !task.value.name || !task.value.cron,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div>
    <div class="form-item">
      {{ t('scheduledtask.name') }} *
      <div class="min-w-[75%]">
        <Input v-model="task.name" autofocus class="w-full" />
      </div>
    </div>
    <div class="form-item">
      {{ t('scheduledtask.cron') }} *
      <div class="min-w-[75%]">
        <Input v-model="task.cron" :placeholder="t('scheduledtask.cronTips')" class="w-full">
          <template #suffix>
            <Button @click="handleValidate" type="primary" size="small">Validate</Button>
            <Button @click="handleViewNextRuns" type="primary" size="small" class="ml-4">
              Next Run Time
            </Button>
          </template>
        </Input>
      </div>
    </div>
    <div class="form-item">
      <div>{{ t('scheduledtask.type') }}</div>
      <Radio v-model="task.type" :options="ScheduledTaskOptions.slice(5)" />
    </div>
    <div class="form-item">
      <div></div>
      <Radio v-model="task.type" :options="ScheduledTaskOptions.slice(0, 5)" />
    </div>
    <div class="form-item">
      {{ t('scheduledtask.notification') }}
      <Switch v-model="task.notification" />
    </div>

    <div v-if="task.type === ScheduledTasksType.UpdateSubscription">
      <Divider>{{ t('scheduledtask.subscriptions') }}</Divider>
      <Empty v-if="subscribesStore.subscribes.length === 0" />
      <div class="grid grid-cols-3 gap-8">
        <Card
          v-for="s in subscribesStore.subscribes"
          :key="s.id"
          :title="s.name"
          :selected="task.subscriptions.includes(s.id)"
          @click="handleUse(task.subscriptions, s.id)"
        >
          <div class="text-12 line-clamp-2">{{ s.type }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.UpdateRuleset">
      <Divider>{{ t('scheduledtask.rulesets') }}</Divider>
      <Empty v-if="rulesetsStore.rulesets.length === 0" />
      <div class="grid grid-cols-3 gap-8">
        <Card
          v-for="r in rulesetsStore.rulesets"
          :key="r.id"
          :title="r.tag"
          :selected="task.rulesets.includes(r.id)"
          @click="handleUse(task.rulesets, r.id)"
        >
          <div class="text-12 line-clamp-2">{{ r.type }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.UpdatePlugin">
      <Divider>{{ t('scheduledtask.plugins') }}</Divider>
      <Empty v-if="pluginsStore.plugins.length === 0" />
      <div class="grid grid-cols-3 gap-8">
        <Card
          v-for="p in pluginsStore.plugins"
          :key="p.id"
          :title="p.name"
          :selected="task.plugins.includes(p.id)"
          @click="handleUse(task.plugins, p.id)"
        >
          <div class="text-12 line-clamp-2">{{ p.type }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.RunPlugin">
      <Divider>{{ t('scheduledtask.plugins') }}</Divider>
      <Empty v-if="pluginsStore.plugins.length === 0" />
      <div class="grid grid-cols-3 gap-8">
        <Card
          v-for="p in pluginsStore.plugins"
          v-tips="p.description"
          :key="p.id"
          :title="p.name"
          :selected="task.plugins.includes(p.id)"
          @click="handleUse(task.plugins, p.id)"
        >
          <div class="text-12 line-clamp-2">{{ p.description }}</div>
        </Card>
      </div>
    </div>

    <div v-else-if="task.type === ScheduledTasksType.RunScript">
      <Divider>{{ t('scheduledtask.script') }}</Divider>
      <CodeViewer v-model="task.script" editable lang="javascript" />
    </div>
  </div>
</template>
