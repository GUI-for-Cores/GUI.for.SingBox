<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { TunStackOptions } from '@/constant/kernel'
import { useKernelApiStore } from '@/stores'
import { message } from '@/utils'

const { t } = useI18n()
const kernelApiStore = useKernelApiStore()

const createValueWatcher = (
  initialValue: number | string | boolean,
  callback: (value: number | string | boolean) => Promise<void>,
) => {
  let lastValue = initialValue
  return (newValue: number | boolean) => {
    if (newValue !== lastValue) {
      lastValue = newValue
      callback(newValue).catch((e) => message.error(e.message || e))
    }
  }
}

const onPortSubmit = createValueWatcher(kernelApiStore.config.port, (port) =>
  kernelApiStore.updateConfig('http', port),
)
const onSocksPortSubmit = createValueWatcher(kernelApiStore.config['socks-port'], (port) =>
  kernelApiStore.updateConfig('socks', port),
)
const onMixedPortSubmit = createValueWatcher(kernelApiStore.config['mixed-port'], (port) =>
  kernelApiStore.updateConfig('mixed', port),
)
const onAllowLanChange = createValueWatcher(kernelApiStore.config['allow-lan'], (allow) =>
  kernelApiStore.updateConfig('allow-lan', allow),
)
const conStackChange = createValueWatcher(kernelApiStore.config.tun.stack, (stack) =>
  kernelApiStore.updateConfig('tun-stack', { stack }),
)
const onTunDeviceSubmit = createValueWatcher(kernelApiStore.config.tun.device, (device) =>
  kernelApiStore.updateConfig('tun-device', { device }),
)
const onInterfaceChange = createValueWatcher(
  kernelApiStore.config['interface-name'],
  (interface_name) => kernelApiStore.updateConfig('interface-name', { interface_name }),
)
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
          type="number"
          :border="false"
          editable
          auto-size
          class="w-full"
          @submit="onMixedPortSubmit"
        />
      </Card>
      <Card :title="t('kernel.inbounds.httpPort')">
        <Input
          v-model="kernelApiStore.config.port"
          :min="0"
          :max="65535"
          type="number"
          :border="false"
          editable
          auto-size
          class="w-full"
          @submit="onPortSubmit"
        />
      </Card>
      <Card :title="t('kernel.inbounds.socksPort')">
        <Input
          v-model="kernelApiStore.config['socks-port']"
          :min="0"
          :max="65535"
          type="number"
          editable
          :border="false"
          auto-size
          class="w-full"
          @submit="onSocksPortSubmit"
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
          editable
          :border="false"
          auto-size
          class="w-full"
          @submit="onTunDeviceSubmit"
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
