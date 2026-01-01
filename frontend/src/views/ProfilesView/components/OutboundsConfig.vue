<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { OutboundOptions, BuiltInOutbound } from '@/constant/kernel'
import { DefaultOutbound } from '@/constant/profile'
import { Outbound } from '@/enums/kernel'
import { useSubscribesStore } from '@/stores'
import { deepClone, message } from '@/utils'

const model = defineModel<IProfile['outbounds']>({ required: true })

let updateGroupId = 0
const showEditModal = ref(false)
const showSortModal = ref(false)
const expandedSet = ref<Set<string>>(new Set(['Built-in', 'Subscription']))
const SubscribesNameMap = ref<Record<string, string>>({})

const proxyGroup = ref([
  {
    id: 'Built-in',
    name: 'kernel.outbounds.builtIn',
    proxies: [
      ...BuiltInOutbound.map((v) => ({ id: v, tag: v, type: 'Built-In' })),
      ...model.value.map(({ id, tag, type }) => ({ id, tag, type: type as string })),
    ],
  },
  {
    id: 'Subscription',
    name: 'kernel.outbounds.subscriptions',
    proxies: [],
  },
])

const fields = ref<IOutbound>(DefaultOutbound())

const { t } = useI18n()
const subscribesStore = useSubscribesStore()

const handleAdd = () => {
  updateGroupId = -1
  fields.value = DefaultOutbound()
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleDeleteGroup = (index: number) => {
  const id = model.value[index]!.id
  model.value.splice(index, 1)
  proxyGroup.value = proxyGroup.value.map((v) => ({
    ...v,
    proxies: v.proxies.filter((v) => v.id !== id),
  }))
}

const handleClearGroup = async (outbound: IOutbound) => {
  const filtered = outbound.outbounds.filter(({ id, type }) => {
    if (type === 'Built-in') {
      return model.value.some((v) => v.id === id)
    } else if (type === 'Subscription') {
      return subscribesStore.getSubscribeById(id)
    }
    const sub = subscribesStore.getSubscribeById(type)
    return sub && sub.proxies.some((v) => v.id === id)
  })
  outbound.outbounds.splice(0)
  outbound.outbounds.push(...filtered)
}

const handleAddEnd = () => {
  const { id, tag, type } = fields.value
  // Add
  if (updateGroupId === -1) {
    model.value.unshift(fields.value)
    proxyGroup.value[0]!.proxies.unshift({ id, tag, type })
    return
  }
  // Update
  model.value[updateGroupId] = fields.value
  const idx = proxyGroup.value[0]!.proxies.findIndex((v) => v.id === id)
  if (idx !== -1) {
    proxyGroup.value[0]!.proxies.splice(idx, 1, { id, tag, type })
    model.value
      .filter((outbound) => [Outbound.Selector, Outbound.Urltest].includes(outbound.type as any))
      .forEach(({ outbounds }) => {
        const proxy = outbounds.find((v) => v.id === id)
        proxy && (proxy.tag = tag)
      })
  }
}

const handleEditGroup = (index: number) => {
  updateGroupId = index
  fields.value = deepClone(model.value[index]!)
  showEditModal.value = true
}

const handleAddProxy = (groupID: string, proxyID: string, proxyName: string) => {
  // self
  if (groupID === 'Built-in' && proxyID === fields.value.id) return

  const idx = fields.value.outbounds.findIndex((outbound) => outbound.id === proxyID)
  if (idx !== -1) {
    fields.value.outbounds.splice(idx, 1)
  } else {
    fields.value.outbounds.push({ id: proxyID, tag: proxyName, type: groupID })
  }
}

const isInuse = (groupID: string, proxyID: string) => {
  return fields.value.outbounds.find((outbound) => outbound.id === proxyID)
}

const hasLost = (outbound: IOutbound) => {
  if ([Outbound.Selector, Outbound.Urltest].includes(outbound.type as any)) {
    return outbound.outbounds.some(({ id, type }) => {
      if (type === 'Built-in') {
        if (BuiltInOutbound.includes(id as Outbound)) {
          return false
        }
        return model.value.every((v) => v.id !== id)
      } else if (type === 'Subscription') {
        const sub = subscribesStore.getSubscribeById(id)
        if (!sub) return true
        return false
      }
      const sub = subscribesStore.getSubscribeById(type)
      if (!sub) return true
      return sub.proxies.every((v) => v.id !== id)
    })
  }
  return false
}

const handleSortGroup = (index: number) => {
  updateGroupId = index
  fields.value = deepClone(model.value[index]!)
  showSortModal.value = true
}

const handleSortGroupEnd = () => {
  model.value[updateGroupId] = fields.value
}

const clacSubscriptionsCount = (outbound: IOutbound) => {
  if ([Outbound.Selector, Outbound.Urltest].includes(outbound.type as any)) {
    return outbound.outbounds.filter((v) => v.type === 'Subscription').length
  }
  return 0
}

const clacOutboundsCount = (outbound: IOutbound) => {
  if ([Outbound.Selector, Outbound.Urltest].includes(outbound.type as any)) {
    return outbound.outbounds.filter((v) => v.type !== 'Subscription').length
  }
  return 0
}

const needToAdd = (outbound: IOutbound) => {
  if ([Outbound.Selector, Outbound.Urltest].includes(outbound.type as any)) {
    return outbound.outbounds.length === 0
  }
  return false
}

const toggleExpanded = (key: string) => {
  if (expandedSet.value.has(key)) {
    expandedSet.value.delete(key)
  } else {
    expandedSet.value.add(key)
  }
}

const isExpanded = (key: string) => expandedSet.value.has(key)

const showLost = () => message.warn('kernel.outbounds.notFound')

const showNeedToAdd = () => message.error('kernel.outbounds.needToAdd')

subscribesStore.subscribes.forEach(async ({ id, name, proxies }) => {
  proxyGroup.value[1]!.proxies.push({ id, tag: name, type: 'Subscribe' })
  proxyGroup.value.push({ id, name, proxies })
  SubscribesNameMap.value[id] = name
})
</script>

<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <Button icon="add" type="primary" size="small" @click="handleAdd">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(outbound, index) in model" :key="outbound.id" class="mb-2">
      <div class="flex items-center py-2">
        <div class="font-bold" style="min-width: 90px">
          <span
            v-if="hasLost(outbound)"
            class="cursor-pointer"
            style="color: rgb(200, 193, 11)"
            @click="showLost"
          >
            [ ! ]
          </span>
          <span
            v-if="needToAdd(outbound)"
            class="cursor-pointer"
            style="color: red"
            @click="showNeedToAdd"
          >
            [ ! ]
          </span>
          {{ outbound.tag }}
        </div>
        <Button type="link" size="small" @click="handleSortGroup(index)">
          (
          {{ t('kernel.outbounds.refsOutbound') }}:{{ clacOutboundsCount(outbound) }}
          /
          {{ t('kernel.outbounds.refsSubscription') }}:{{ clacSubscriptionsCount(outbound) }}
          )
        </Button>
        <div class="ml-auto">
          <Button v-if="hasLost(outbound)" type="text" @click="handleClearGroup(outbound)">
            {{ t('common.clear') }}
          </Button>
          <Button icon="edit" type="text" size="small" @click="handleEditGroup(index)" />
          <Button icon="delete" type="text" size="small" @click="handleDeleteGroup(index)" />
        </div>
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showSortModal"
    :on-ok="handleSortGroupEnd"
    mask-closable
    title="kernel.outbounds.sort"
    max-width="80"
    max-height="80"
  >
    <Divider>{{ t('kernel.outbounds.refs') }}</Divider>
    <Empty v-if="fields.outbounds.length === 0" />
    <div v-draggable="[fields.outbounds, DraggableOptions]">
      <Button v-for="proxy in fields.outbounds" :key="proxy.id" type="link">
        {{ proxy.tag }}
      </Button>
    </div>
  </Modal>

  <Modal
    v-model:open="showEditModal"
    :on-ok="handleAddEnd"
    title="kernel.outbounds.name"
    width="80"
    height="80"
  >
    <div class="form-item">
      {{ t('kernel.outbounds.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.type') }}
      <Radio v-model="fields.type" :options="OutboundOptions" />
    </div>
    <template v-if="Outbound.Selector === fields.type || Outbound.Urltest === fields.type">
      <div class="form-item">
        {{ t('kernel.outbounds.interrupt_exist_connections') }}
        <Switch v-model="fields.interrupt_exist_connections" />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.include') }}
        <Input v-model="fields.include" placeholder="keywords1|keywords2" />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.exclude') }}
        <Input v-model="fields.exclude" placeholder="keywords1|keywords2" />
      </div>
    </template>
    <template v-if="Outbound.Direct === fields.type || Outbound.Block === fields.type">
      <Empty :description="t('kernel.outbounds.directDesc')" />
    </template>
    <template v-else-if="fields.type === Outbound.Urltest">
      <div class="form-item">
        {{ t('kernel.outbounds.url') }}
        <Input v-model="fields.url" placeholder="http(s)://" />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.interval') }}
        <Input v-model="fields.interval" placeholder="3m" />
      </div>
      <div class="form-item">
        {{ t('kernel.outbounds.tolerance') }}
        <Input v-model="fields.tolerance" type="number" />
      </div>
    </template>
    <template v-if="[Outbound.Selector, Outbound.Urltest].includes(fields.type as any)">
      <Divider>
        {{ t('kernel.outbounds.refsOutbound') }} & {{ t('kernel.outbounds.refsSubscription') }}
      </Divider>

      <div v-for="group in proxyGroup" :key="group.id" class="group">
        <Button
          :type="isExpanded(group.id) ? 'link' : 'text'"
          class="sticky top-0 backdrop-blur-sm w-full"
          @click="toggleExpanded(group.id)"
        >
          {{ t(group.name) }}
          <div class="ml-auto mr-8">{{ group.proxies.length }}</div>
          <Icon
            :class="{ 'rotate-z': isExpanded(group.id) }"
            icon="arrowRight"
            class="action-expand"
          />
        </Button>
        <div v-show="isExpanded(group.id)">
          <Empty
            v-if="group.proxies.length === 0"
            :description="
              group.id === 'Subscription'
                ? t('kernel.outbounds.noSubs')
                : t('kernel.outbounds.empty')
            "
          />
          <template v-else>
            <div class="w-full grid grid-cols-4 gap-8 p-8">
              <Button
                v-for="proxy in group.proxies"
                :key="proxy.id"
                :type="isInuse(group.id, proxy.id) ? 'link' : 'text'"
                @click="handleAddProxy(group.id, proxy.id, proxy.tag)"
              >
                {{ proxy.tag }}
                <br />
                {{ proxy.type }}
              </Button>
            </div>
          </template>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style lang="less" scoped>
.action-expand {
  transition: all 0.2s;
}
.rotate-z {
  transform: rotateZ(90deg);
}
</style>
