<script lang="ts" setup>
import { computed, nextTick, onMounted, type SetupContext, type Slot } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  usePluginsStore,
  useProfilesStore,
  useRulesetsStore,
  useScheduledTasksStore,
  useSubscribesStore,
} from '@/stores'
import { message, modal } from '@/utils'

import type { RuleSet } from '@/stores'
import type { Plugin, ScheduledTask, Subscription } from '@/types/app'

type ResourceType = 'profile' | 'subscription' | 'ruleset' | 'plugin' | 'scheduledtask'
type ResourceItem = IProfile | Subscription | RuleSet | Plugin | ScheduledTask
type ResourceConfig = {
  title: string
  list: ResourceItem[]
  getById: (id: string) => ResourceItem | undefined
  getName: (item: ResourceItem) => string
  getDescription: (item: ResourceItem) => string
}

export interface ResourceSelectProps {
  type: ResourceType
  title?: string
  cols?: number
  max?: number
  min?: number
  renderSlot?: boolean
  openImmediate?: boolean
}

const props = withDefaults(defineProps<ResourceSelectProps>(), {
  title: undefined,
  cols: 3,
  min: 0,
  max: Number.MAX_SAFE_INTEGER,
  renderSlot: true,
  openImmediate: false,
})

const model = defineModel<string[]>({ default: [] })

const emit = defineEmits<{
  (e: 'change', val: string[], items: ResourceItem[]): void
  (e: 'submit', val: string[], items: ResourceItem[]): void
}>()

const { t } = useI18n()
const profilesStore = useProfilesStore()
const subscribesStore = useSubscribesStore()
const rulesetsStore = useRulesetsStore()
const pluginsStore = usePluginsStore()
const scheduledTasksStore = useScheduledTasksStore()

const resourceConfig = computed(() => {
  const configs: Record<ResourceType, ResourceConfig> = {
    profile: {
      title: 'profiles.select',
      list: profilesStore.profiles,
      getById: profilesStore.getProfileById,
      getName: (item) => (item as IProfile).name,
      getDescription: () => '',
    },
    subscription: {
      title: 'subscribes.select',
      list: subscribesStore.subscribes,
      getById: subscribesStore.getSubscribeById,
      getName: (item) => (item as Subscription).name,
      getDescription: (item) => (item as Subscription).type,
    },
    ruleset: {
      title: 'rulesets.select',
      list: rulesetsStore.rulesets,
      getById: rulesetsStore.getRulesetById,
      getName: (item) => (item as RuleSet).name,
      getDescription: (item) => {
        const ruleset = item as RuleSet
        return `${ruleset.type} / ${ruleset.format}`
      },
    },
    plugin: {
      title: 'plugins.select',
      list: pluginsStore.plugins,
      getById: pluginsStore.getPluginById,
      getName: (item) => (item as Plugin).name,
      getDescription: (item) => {
        const plugin = item as Plugin
        return plugin.description || plugin.type
      },
    },
    scheduledtask: {
      title: 'scheduledtasks.select',
      list: scheduledTasksStore.scheduledtasks,
      getById: scheduledTasksStore.getScheduledTaskById,
      getName: (item) => (item as ScheduledTask).name,
      getDescription: (item) => t('scheduledtask.' + (item as ScheduledTask).type),
    },
  }

  return configs[props.type]
})

const modalTitle = computed(() => props.title || resourceConfig.value.title)

let defaultSlot: Slot | undefined
let actionSlot: Slot | undefined

const DefineTemplate = (_: unknown, { slots }: SetupContext) => {
  defaultSlot = slots.default
  actionSlot = slots.action
  return null
}

const open = () => {
  const m = modal(
    {
      title: modalTitle.value,
      submit: false,
      afterClose: () => {
        emit('submit', model.value, getItems())
        m.destroy()
      },
      maskClosable: true,
      cancelText: 'common.close',
    },
    {
      default: defaultSlot,
      action: actionSlot,
    },
  )
  m.open()
}

const isBelowMinSelection = computed(() => model.value.length < props.min)

const getItems = (val = model.value) => {
  return val.flatMap((id) => {
    const item = resourceConfig.value.getById(id)
    return item ? [item] : []
  })
}

const handleSelect = (item: ResourceItem) => {
  const id = item.id

  const nextValue: string[] = []

  if (model.value.includes(id)) {
    nextValue.push(...model.value.filter((item) => item !== id))
  } else {
    nextValue.push(...model.value, id)
    if (nextValue.length > props.max) {
      message.warn('common.maxSelectionExceeded')
      return
    }
  }

  model.value = nextValue

  emit('change', nextValue, getItems(nextValue))
}

onMounted(() => {
  if (props.openImmediate) {
    nextTick(open)
  }
})
</script>

<template>
  <slot v-if="renderSlot" v-bind="{ selected: model, open }">
    <Button @click="open">{{ t('common.select') }}</Button>
  </slot>

  <DefineTemplate>
    <template #action>
      <Button class="mr-auto" type="text" size="small">
        {{
          isBelowMinSelection
            ? t('common.selectAtLeast', [props.min])
            : t('common.selectedCount', [model.length])
        }}
      </Button>
    </template>
    <Empty v-if="resourceConfig.list.length === 0" />
    <div class="grid gap-8 pb-8" :class="[`grid-cols-${cols}`]">
      <Card
        v-for="item in resourceConfig.list"
        :key="item.id"
        :title="resourceConfig.getName(item)"
        :selected="model.includes(item.id)"
        @click="handleSelect(item)"
      >
        <div class="text-12 line-clamp-2">{{ resourceConfig.getDescription(item) }}</div>
      </Card>
    </div>
  </DefineTemplate>
</template>
