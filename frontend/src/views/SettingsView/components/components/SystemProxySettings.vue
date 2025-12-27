<script lang="ts" setup>
import { useAppSettingsStore } from '@/stores'

const appSettings = useAppSettingsStore()
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.systemProxy') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.autoSetSystemProxy') }}</div>
      <Switch v-model="appSettings.app.autoSetSystemProxy" />
    </div>
    <div class="px-8 pt-12 pb-8 flex flex-col gap-12">
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
  </Card>
</template>
