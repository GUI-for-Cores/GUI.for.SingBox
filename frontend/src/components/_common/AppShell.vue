<script setup lang="ts">
import { useRoute } from 'vue-router'

import NavigationBar from './NavigationBar.vue'
import TitleBar from './TitleBar.vue'

const route = useRoute()
</script>

<template>
  <TitleBar />
  <div class="app-content flex-1 overflow-y-auto flex flex-col p-8">
    <NavigationBar />
    <div
      :class="{ 'app-page--overview': route.name === 'Overview' }"
      class="app-page flex flex-col overflow-y-auto mt-8 px-8 h-full"
    >
      <RouterView #="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </div>
</template>
