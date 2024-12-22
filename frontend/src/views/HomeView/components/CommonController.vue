<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { TunStackOptions } from '@/constant/kernel'
import { useKernelApiStore } from '@/stores'

const { t } = useI18n()
const kernelApiStore = useKernelApiStore()

const onPortSubmit = (port: number) => kernelApiStore.updateConfig('http', port)
const onSocksPortSubmit = (port: number) => kernelApiStore.updateConfig('socks', port)
const onMixedPortSubmit = (port: number) => kernelApiStore.updateConfig('mixed', port)
const onAllowLanChange = (allow: boolean) => kernelApiStore.updateConfig('allow-lan', allow)
const conStackChange = (stack: string) => kernelApiStore.updateConfig('tun-stack', { stack })
const onTunDeviceSubmit = (device: string) => kernelApiStore.updateConfig('tun-device', { device })
const onInterfaceChange = (interface_name: string) =>
  kernelApiStore.updateConfig('interface-name', { interface_name })
</script>

<template>
  <div class="card-list">
    <Divider class="w-full mb-8">
      {{ t('home.overview.settingsTips') }}
    </Divider>

    <Card :title="t('kernel.inbounds.mixedPort')" class="card-item">
      <Input
        v-model="kernelApiStore.config['mixed-port']"
        :min="0"
        :max="65535"
        @submit="onMixedPortSubmit"
        type="number"
        :border="false"
        editable
        auto-size
      />
    </Card>
    <Card :title="t('kernel.inbounds.httpPort')" class="card-item">
      <Input
        v-model="kernelApiStore.config.port"
        :min="0"
        :max="65535"
        @submit="onPortSubmit"
        type="number"
        :border="false"
        editable
        auto-size
      />
    </Card>
    <Card :title="t('kernel.inbounds.socksPort')" class="card-item">
      <Input
        v-model="kernelApiStore.config['socks-port']"
        :min="0"
        :max="65535"
        @submit="onSocksPortSubmit"
        type="number"
        editable
        :border="false"
        auto-size
      />
    </Card>
    <Card :title="t('kernel.allow-lan')" class="card-item">
      <Switch v-model="kernelApiStore.config['allow-lan']" @change="onAllowLanChange" />
    </Card>

    <div class="w-full mt-8"></div>

    <Card :title="t('kernel.inbounds.tun.stack')" class="card-item">
      <Select
        v-model="kernelApiStore.config.tun.stack"
        :options="TunStackOptions"
        :border="false"
        auto-size
        @change="conStackChange"
      />
    </Card>
    <Card :title="t('kernel.inbounds.tun.interface_name')" class="card-item">
      <Input
        v-model="kernelApiStore.config.tun.device"
        @submit="onTunDeviceSubmit"
        editable
        :border="false"
        auto-size
      />
    </Card>
    <Card :title="t('kernel.route.default_interface')" class="card-item">
      <InterfaceSelect
        v-model="kernelApiStore.config['interface-name']"
        :border="false"
        auto-size
        @change="onInterfaceChange"
      />
    </Card>
    <Card :title="t('common.none')" class="card-item"> </Card>
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
