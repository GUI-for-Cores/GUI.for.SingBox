<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { sampleID } from '@/utils'
import { usePicker } from '@/hooks'
import { Inbound } from '@/enums/kernel'
import { DraggableOptions } from '@/constant/app'
import { TunStackOptions } from '@/constant/kernel'
import {
  DefaultInbounds,
  DefaultInboundMixed,
  DefaultInboundHttp,
  DefaultInboundSocks,
  DefaultInboundTun
} from '@/constant/profile'

const model = defineModel<IProfile['inbounds']>({
  default: DefaultInbounds()
})

const { t } = useI18n()
const { picker } = usePicker()

const handleDelete = (index: number) => {
  model.value.splice(index, 1)
}

const inbounds = [
  {
    label: 'Mixed',
    value: () => {
      model.value.push({
        id: sampleID(),
        tag: 'mixed-in',
        type: Inbound.Mixed,
        enable: true,
        mixed: DefaultInboundMixed()
      })
    }
  },
  {
    label: 'Http',
    value: () => {
      model.value.push({
        id: sampleID(),
        tag: 'http-in',
        type: Inbound.Http,
        enable: true,
        http: DefaultInboundHttp()
      })
    }
  },
  {
    label: 'Socks',
    value: () => {
      model.value.push({
        id: sampleID(),
        tag: 'socks-in',
        type: Inbound.Socks,
        enable: true,
        socks: DefaultInboundSocks()
      })
    }
  },
  {
    label: 'Tun',
    value: () => {
      model.value.push({
        id: sampleID(),
        tag: 'tun-in',
        type: Inbound.Tun,
        enable: true,
        tun: DefaultInboundTun()
      })
    }
  }
]

const handleAdd = async () => {
  const fns = await picker.multi<(() => void)[]>('common.add', inbounds as any)
  fns.forEach((fn) => fn())
}

defineExpose({ handleAdd })
</script>

<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <div class="flex">
        <Button v-for="inbound in inbounds" :key="inbound.label" @click="inbound.value">
          {{ t('common.add') }} {{ inbound.label }}
        </Button>
      </div>
    </template>
  </Empty>
  <div v-draggable="[model, { ...DraggableOptions, handle: '.drag' }]">
    <Card v-for="(inbound, index) in model" :key="inbound.id" :title="inbound.tag" class="mb-8">
      <template #title-prefix>
        <Icon icon="drag" class="drag" style="cursor: move" />
      </template>
      <template #extra>
        <Button @click="handleDelete(index)" icon="delete" type="text" size="small" />
      </template>
      <div class="form-item">
        {{ t('kernel.inbounds.enable') }}
        <Switch v-model="inbound.enable" />
      </div>
      <div class="form-item">
        {{ t('kernel.inbounds.tag') }}
        <Input v-model="inbound.tag" />
      </div>
      <div v-if="inbound.type !== Inbound.Tun && inbound[inbound.type]">
        <div class="form-item">
          {{ t('kernel.inbounds.listen.listen') }}
          <Input v-model="inbound[inbound.type]!.listen.listen" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.listen.listen_port') }}
          <Input v-model="inbound[inbound.type]!.listen.listen_port" type="number" />
        </div>
        <div :class="{ 'flex-start': inbound[inbound.type]!.users.length }" class="form-item">
          {{ t('kernel.inbounds.users') }}
          <InputList v-model="inbound[inbound.type]!.users" placeholder="user:password" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.listen.tcp_fast_open') }}
          <Switch v-model="inbound[inbound.type]!.listen.tcp_fast_open" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.listen.tcp_multi_path') }}
          <Switch v-model="inbound[inbound.type]!.listen.tcp_multi_path" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.listen.udp_fragment') }}
          <Switch v-model="inbound[inbound.type]!.listen.udp_fragment" />
        </div>
      </div>
      <div v-else-if="inbound.type === Inbound.Tun && inbound.tun">
        <div class="form-item">
          {{ t('kernel.inbounds.tun.interface_name') }}
          <Input v-model="inbound.tun.interface_name" editable />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.tun.stack') }}
          <Radio v-model="inbound.tun.stack" :options="TunStackOptions" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.tun.auto_route') }}
          <Switch v-model="inbound.tun.auto_route" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.tun.strict_route') }}
          <Switch v-model="inbound.tun.strict_route" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.tun.endpoint_independent_nat') }}
          <Switch v-model="inbound.tun.endpoint_independent_nat" />
        </div>
        <div class="form-item">
          {{ t('kernel.inbounds.tun.mtu') }}
          <Input v-model="inbound.tun.mtu" type="number" editable />
        </div>
        <div :class="{ 'flex-start': inbound.tun.address.length }" class="form-item">
          {{ t('kernel.inbounds.tun.address') }}
          <InputList v-model="inbound.tun.address" />
        </div>
        <div :class="{ 'flex-start': inbound.tun.route_address.length }" class="form-item">
          {{ t('kernel.inbounds.tun.route_address') }}
          <InputList v-model="inbound.tun.route_address" />
        </div>
      </div>
    </Card>
  </div>
</template>
