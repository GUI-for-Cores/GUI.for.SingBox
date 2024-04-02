<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { StackOptions } from '@/constant'
import { useKernelApiStore } from '@/stores'

import InterfaceSelect from '@/components/Profile/InterfaceSelect.vue'

const { t } = useI18n()
const kernelApiStore = useKernelApiStore()

const onPortSubmit = (port: number) => kernelApiStore.updateConfig('http-port', port)
const onSocksPortSubmit = (port: number) => kernelApiStore.updateConfig('socks-port', port)
const onMixedPortSubmit = (port: number) => kernelApiStore.updateConfig('mixed-port', port)
const onAllowLanChange = (allow: boolean) => kernelApiStore.updateConfig('allow-lan', allow)
const conStackChange = (stack: string) => kernelApiStore.updateConfig('tun-stack', stack)
const onTunDeviceSubmit = (device: string) => kernelApiStore.updateConfig('tun-device', device)
const onInterfaceChange = (name: string) => kernelApiStore.updateConfig('interface-name', name)
const onFakeIpChange = (name: string) => kernelApiStore.updateConfig('fakeip', name)
</script>

<template>
  <div class="card-list">
    <Divider class="w-full mb-8">
      {{ t('home.overview.settingsTips') }}
    </Divider>

    <Card :title="t('kernel.mixed-port')" class="card-item">
      <Input
        v-model="kernelApiStore.config['mixed-port']"
        :min="0"
        :max="65535"
        @submit="onMixedPortSubmit"
        type="number"
        editable
      />
    </Card>
    <Card :title="t('kernel.port')" class="card-item">
      <Input
        v-model="kernelApiStore.config.port"
        :min="0"
        :max="65535"
        @submit="onPortSubmit"
        type="number"
        editable
      />
    </Card>
    <Card :title="t('kernel.socks-port')" class="card-item">
      <Input
        v-model="kernelApiStore.config['socks-port']"
        :min="0"
        :max="65535"
        @submit="onSocksPortSubmit"
        type="number"
        editable
      />
    </Card>
    <Card :title="t('kernel.allow-lan')" class="card-item">
      <Switch v-model="kernelApiStore.config['allow-lan']" @change="onAllowLanChange" />
    </Card>

    <div class="w-full mt-8"></div>

    <Card :title="t('kernel.tun.stack')" class="card-item">
      <Select
        v-model="kernelApiStore.config.tun.stack"
        :options="StackOptions"
        :border="false"
        auto-size
        @change="conStackChange"
      />
    </Card>
    <Card :title="t('kernel.tun.interface_name')" class="card-item">
      <Input v-model="kernelApiStore.config.tun.device" @submit="onTunDeviceSubmit" editable />
    </Card>
    <Card :title="t('kernel.interface-name')" class="card-item">
      <InterfaceSelect
        v-model="kernelApiStore.config['interface-name']"
        :border="false"
        auto-size
        @change="onInterfaceChange"
      />
    </Card>
    <Card title="Fake-IP" class="card-item">
      <Switch v-model="kernelApiStore.config.fakeip" @change="onFakeIpChange" />
    </Card>
  </div>
</template>

<style lang="less" scoped>
.card-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding-bottom: 16px;
  .card-item {
    width: 24%;
  }
}
</style>
