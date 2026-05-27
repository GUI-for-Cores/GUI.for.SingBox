<script setup lang="ts">
import { useAppBootstrap, useAppLifecycle } from '@/hooks'

import { SplashView, AppShell, GlobalOverlays } from '@/components'

const { loading, percent, hasError } = useAppBootstrap()

useAppLifecycle()
</script>

<template>
  <SplashView v-if="loading">
    <Progress
      :percent="percent"
      :status="hasError ? 'danger' : 'primary'"
      :radius="10"
      type="circle"
    />
  </SplashView>
  <AppShell v-else />
  <GlobalOverlays :loading="loading" />
</template>
