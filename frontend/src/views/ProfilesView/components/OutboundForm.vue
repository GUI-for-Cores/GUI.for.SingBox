<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { OutboundOptions, BuiltInOutbound } from '@/constant/kernel'
import { Outbound } from '@/enums/kernel'
import { useSubscribesStore } from '@/stores'

interface Props {
  outbound: App.Outbound
  outbounds: App.Profile['outbounds']
}

const props = defineProps<Props>()
const { outbound } = toRefs(props)

const { t } = useI18n()
const subscribesStore = useSubscribesStore()
const expandedSet = ref<Set<string>>(new Set(['Built-in', 'Subscription']))

const outboundGroups = [
  {
    id: 'Built-in',
    name: 'kernel.outbounds.builtIn',
    proxies: [
      ...BuiltInOutbound.map((v) => ({ id: v, tag: v, type: 'Built-In' })),
      ...props.outbounds.map(({ id, tag, type }) => ({ id, tag, type: type as string })),
    ],
  },
  {
    id: 'Subscription',
    name: 'kernel.outbounds.subscriptions',
    proxies: subscribesStore.subscribes.map(({ id, name }) => ({
      id,
      tag: name,
      type: 'Subscribe',
    })),
  },
  ...subscribesStore.subscribes.map(({ id, name, proxies }) => ({ id, name, proxies })),
]

const handleAddProxy = (groupID: string, proxyID: string, proxyName: string) => {
  if (groupID === 'Built-in' && proxyID === outbound.value.id) return

  const idx = outbound.value.outbounds.findIndex((item) => item.id === proxyID)
  if (idx !== -1) {
    outbound.value.outbounds.splice(idx, 1)
  } else {
    outbound.value.outbounds.push({ id: proxyID, tag: proxyName, type: groupID })
  }
}

const isInuse = (proxyID: string) => outbound.value.outbounds.some((item) => item.id === proxyID)

const toggleExpanded = (key: string) => {
  if (expandedSet.value.has(key)) {
    expandedSet.value.delete(key)
  } else {
    expandedSet.value.add(key)
  }
}

const isExpanded = (key: string) => expandedSet.value.has(key)
</script>

<template>
  <div class="form-item">
    {{ t('kernel.outbounds.tag') }}
    <Input v-model="outbound.tag" autofocus />
  </div>
  <div class="form-item">
    {{ t('kernel.outbounds.type') }}
    <Radio v-model="outbound.type" :options="OutboundOptions" />
  </div>
  <template v-if="Outbound.Selector === outbound.type || Outbound.Urltest === outbound.type">
    <div class="form-item">
      {{ t('kernel.outbounds.hidden') }}
      <Switch v-model="outbound.hidden" />
    </div>
    <!-- <div class="form-item">
      {{ t('kernel.outbounds.interrupt_exist_connections') }}
      <Switch v-model="outbound.interrupt_exist_connections" />
    </div> -->
    <div class="form-item">
      {{ t('kernel.outbounds.include') }}
      <Input v-model="outbound.include" placeholder="keywords1|keywords2" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.exclude') }}
      <Input v-model="outbound.exclude" placeholder="keywords1|keywords2" />
    </div>
    <div class="form-item">
      <div class="flex items-center gap-8">
        {{ t('kernel.outbounds.icon') }}
        <img v-if="outbound.icon" :src="outbound.icon" class="w-18 h-18" />
      </div>
      <Input v-model="outbound.icon" clearable placeholder="https://" />
    </div>
  </template>
  <template v-if="Outbound.Direct === outbound.type || Outbound.Block === outbound.type">
    <Empty :description="t('kernel.outbounds.directDesc')" />
  </template>
  <template v-else-if="outbound.type === Outbound.Urltest">
    <div class="form-item">
      {{ t('kernel.outbounds.url') }}
      <Input v-model="outbound.url" placeholder="http(s)://" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.interval') }}
      <Input v-model="outbound.interval" placeholder="3m" />
    </div>
    <div class="form-item">
      {{ t('kernel.outbounds.tolerance') }}
      <Input v-model="outbound.tolerance" type="number" />
    </div>
  </template>
  <template v-if="[Outbound.Selector, Outbound.Urltest].includes(outbound.type as any)">
    <Divider>
      {{ t('kernel.outbounds.refsOutbound') }} & {{ t('kernel.outbounds.refsSubscription') }}
    </Divider>

    <div v-for="group in outboundGroups" :key="group.id" class="group">
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
            group.id === 'Subscription' ? t('kernel.outbounds.noSubs') : t('kernel.outbounds.empty')
          "
        />
        <div v-else class="w-full grid grid-cols-4 gap-8 p-8">
          <Button
            v-for="proxy in group.proxies"
            :key="proxy.id"
            :type="isInuse(proxy.id) ? 'link' : 'text'"
            @click="handleAddProxy(group.id, proxy.id, proxy.tag)"
          >
            {{ proxy.tag }}
            <br />
            {{ proxy.type }}
          </Button>
        </div>
      </div>
    </div>
  </template>
</template>

<style lang="less" scoped>
.action-expand {
  transition: all 0.2s;
}
.rotate-z {
  transform: rotateZ(90deg);
}
</style>
