<script setup lang="ts">
import { NavigationBar, TitleBar } from '@/components'
</script>

<template>
  <TitleBar />
  <div class="flex-1 overflow-y-auto flex flex-col p-8">
    <NavigationBar />
    <div class="flex flex-col overflow-y-auto mt-8 px-8 h-full">
      <RouterView #="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </div>
</template>
