<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { h, ref, type VNode } from 'vue'

import { useBool } from '@/hooks'
import { deepClone } from '@/utils'
import { DraggableOptions } from '@/constant/app'
import { DomainStrategyOptions } from '@/constant/kernel'
import { DefaultDnsServer, DefaultDnsServers } from '@/constant/profile'

import Tag from '@/components/Tag/index.vue'

interface Props {
  outboundOptions: { label: string; value: string }[]
  serversOptions: { label: string; value: string }[]
}

const props = defineProps<Props>()

const model = defineModel<IDNSServer[]>({ default: DefaultDnsServers() })

let serverId = 0
const fields = ref<IDNSServer>(DefaultDnsServer())

const { t } = useI18n()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  serverId = -1
  fields.value = DefaultDnsServer()
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (serverId !== -1) {
    model.value[serverId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
}

const handleEdit = (index: number) => {
  serverId = index
  fields.value = deepClone(model.value[index])
  showEditModal.value = true
}

const handleDeleteRule = (index: number) => {
  model.value.splice(index, 1)
}

const renderServer = (server: IDNSServer) => {
  const { tag, address, detour } = server
  const children: VNode[] = [h(Tag, { color: 'cyan' }, () => tag), h(Tag, () => address)]
  if (detour) {
    const tag = props.outboundOptions.find((v) => v.value === detour)?.label || detour
    children.push(h(Tag, { color: 'default' }, () => tag))
  }
  return h('div', children)
}
</script>
<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <Button @click="handleAdd" icon="add" type="primary" size="small">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(server, index) in model" :key="server.id" class="server-item">
      <div class="font-bold flex items-center">
        <component :is="renderServer(server)" />
      </div>
      <div class="ml-auto">
        <Button @click="handleEdit(index)" icon="edit" type="text" size="small" />
        <Button @click="handleDeleteRule(index)" icon="delete" type="text" size="small" />
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    @ok="handleAddEnd"
    title="kernel.dns.tab.servers"
    max-width="80"
    max-height="80"
  >
    <div class="form-item">
      {{ t('kernel.dns.tag') }}
      <Input v-model="fields.tag" autofocus />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.address') }}
      <Input v-model="fields.address" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.strategy') }}
      <Select v-model="fields.strategy" :options="DomainStrategyOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.detour') }}
      <Select v-model="fields.detour" :options="outboundOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.address_resolver') }}
      <Select v-model="fields.address_resolver" :options="serversOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.client_subnet') }}
      <Input v-model="fields.client_subnet" editable />
    </div>
  </Modal>
</template>

<style lang="less" scoped>
.server-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 2px;
  .warn {
    color: rgb(200, 193, 11);
    cursor: pointer;
  }
}
</style>
