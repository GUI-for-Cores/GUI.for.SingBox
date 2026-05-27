<script lang="ts" setup>
import { computed, ref } from 'vue'

import { HttpGet } from '@/bridge'
import { DefaultTestTimeout, DefaultTestURL, RequestProxyModeOptions } from '@/constant/app'
import { RequestProxyMode } from '@/enums/app'
import { useAppSettingsStore } from '@/stores'
import { APP_TITLE, APP_VERSION, GetRequestProxy, message, normalizeRequestProxy } from '@/utils'

const appSettings = useAppSettingsStore()

const testing = ref(false)
const isCustomProxy = computed(() => appSettings.app.requestProxyMode === RequestProxyMode.Custom)
const showProxyTest = computed(() => appSettings.app.requestProxyMode !== RequestProxyMode.None)

const getCurrentProxy = async () => {
  if (isCustomProxy.value) {
    return normalizeRequestProxy(appSettings.app.customProxy)
  }
  return GetRequestProxy()
}

const handleTestProxy = async () => {
  const proxy = await getCurrentProxy()
  if (!proxy) {
    message.error('settings.requestProxy.empty')
    return
  }

  testing.value = true
  try {
    await HttpGet(DefaultTestURL, {}, { Proxy: proxy, Timeout: DefaultTestTimeout })
    message.success('settings.requestProxy.testSuccess')
  } catch (error) {
    message.error(error)
  } finally {
    testing.value = false
  }
}

const handleClearUserAgent = () => {
  appSettings.app.userAgent = ''
}

const handleClearCustomProxy = () => {
  appSettings.app.customProxy = ''
}
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.network') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.requestProxy.name') }}</div>
      <div class="flex items-center gap-4">
        <Button
          v-if="showProxyTest"
          :loading="testing"
          type="primary"
          size="small"
          @click="handleTestProxy"
        >
          {{ $t('settings.requestProxy.test') }}
        </Button>
        <Radio v-model="appSettings.app.requestProxyMode" :options="RequestProxyModeOptions" />
      </div>
    </div>
    <div v-if="isCustomProxy" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.requestProxy.custom') }}</div>
      <Input
        v-model.lazy="appSettings.app.customProxy"
        placeholder="scheme://username:password@host:port"
        editable
        clearable
        :max-width="false"
        class="text-14"
      >
        <template #suffix>
          <Button
            v-tips="'settings.userAgent.reset'"
            type="text"
            size="small"
            icon="reset"
            @click="handleClearCustomProxy"
          />
        </template>
      </Input>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.userAgent.name') }}
        <span class="font-normal text-12">({{ $t('settings.userAgent.tips') }})</span>
      </div>
      <Input
        v-model.lazy="appSettings.app.userAgent"
        :placeholder="APP_TITLE + '/' + APP_VERSION"
        editable
        :max-width="false"
        class="text-14"
      >
        <template #suffix>
          <Button
            v-tips="'settings.userAgent.reset'"
            type="text"
            size="small"
            icon="reset"
            @click="handleClearUserAgent"
          />
        </template>
      </Input>
    </div>
  </Card>
</template>
