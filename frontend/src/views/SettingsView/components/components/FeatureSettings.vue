<script lang="ts" setup>
import { useAppSettingsStore } from '@/stores'
const appSettings = useAppSettingsStore()
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.debug') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.debugOutline') }}</div>
      <Switch v-model="appSettings.app.debugOutline" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.debugBorder') }}</div>
      <Switch v-model="appSettings.app.debugBorder" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.debugNoAnimation') }}</div>
      <Switch v-model="appSettings.app.debugNoAnimation" />
    </div>
  </Card>
</template>
