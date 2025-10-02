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
  <div>
    <Divider class="w-full mb-8"> {{ t('home.overview.settingsTips') }} </Divider>
    <div class="grid grid-cols-4 gap-8 pb-16">
      <Card :title="t('kernel.inbounds.mixedPort')">
        <Input
          v-model="kernelApiStore.config['mixed-port']"
          :min="0"
          :max="65535"
          @submit="onMixedPortSubmit"
          type="number"
          :border="false"
          editable
          auto-size
          class="w-full"
        />
      </Card>
      <Card :title="t('kernel.inbounds.httpPort')">
        <Input
          v-model="kernelApiStore.config.port"
          :min="0"
          :max="65535"
          @submit="onPortSubmit"
          type="number"
          :border="false"
          editable
          auto-size
          class="w-full"
        />
      </Card>
      <Card :title="t('kernel.inbounds.socksPort')">
        <Input
          v-model="kernelApiStore.config['socks-port']"
          :min="0"
          :max="65535"
          @submit="onSocksPortSubmit"
          type="number"
          editable
          :border="false"
          auto-size
          class="w-full"
        />
      </Card>
      <Card :title="t('kernel.allow-lan')">
        <Switch v-model="kernelApiStore.config['allow-lan']" @change="onAllowLanChange" />
      </Card>
      <Card :title="t('kernel.inbounds.tun.stack')">
        <Select
          v-model="kernelApiStore.config.tun.stack"
          :options="TunStackOptions"
          :border="false"
          auto-size
          @change="conStackChange"
        />
      </Card>
      <Card :title="t('kernel.inbounds.tun.interface_name')">
        <Input
          v-model="kernelApiStore.config.tun.device"
          @submit="onTunDeviceSubmit"
          editable
          :border="false"
          auto-size
          class="w-full"
        />
      </Card>
      <Card :title="t('kernel.route.default_interface')">
        <InterfaceSelect
          v-model="kernelApiStore.config['interface-name']"
          :border="false"
          auto-size
          @change="onInterfaceChange"
        />
      </Card>
      <Card :title="t('common.none')"> </Card>
    </div>
  </div>
</template>
