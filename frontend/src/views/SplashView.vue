<script setup lang="ts">
import { APP_TITLE, APP_VERSION } from '@/utils/env'
</script>

<template>
  <div class="splash" style="--wails-draggable: drag">
    <img src="@/assets/logo.png" style="width: 128px" draggable="false" />
    <h2>{{ APP_TITLE }}</h2>
    <p>{{ APP_VERSION }}</p>
  </div>
</template>

<style lang="less" scoped>
.splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
