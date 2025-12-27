<script lang="ts" setup>
import { useAppSettingsStore } from '@/stores'
import { APP_TITLE, APP_VERSION } from '@/utils'

const appSettings = useAppSettingsStore()

const handleClearUserAgent = () => {
  appSettings.app.userAgent = ''
}
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.systemProxy') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.autoSetSystemProxy') }}</div>
      <Switch v-model="appSettings.app.autoSetSystemProxy" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.proxyBypassList') }}
        <span class="font-normal text-12">({{ $t('settings.proxyBypassListTips') }})</span>
      </div>
      <CodeViewer
        v-model="appSettings.app.proxyBypassList"
        editable
        lang="yaml"
        class="min-w-256"
      />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.userAgent.name') }}</div>
      <Input
        v-model.lazy="appSettings.app.userAgent"
        :placeholder="APP_TITLE + '/' + APP_VERSION"
        editable
        class="text-14"
      >
        <template #suffix>
          <Button
            @click="handleClearUserAgent"
            v-tips="'settings.userAgent.reset'"
            type="text"
            size="small"
            icon="reset"
          />
        </template>
      </Input>
    </div>
  </Card>
</template>
