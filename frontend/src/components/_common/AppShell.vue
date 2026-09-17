<script setup lang="ts">
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores'

import ModalTabs from './ModalTabs.vue'
import NavigationBar from './NavigationBar.vue'
import TitleBar from './TitleBar.vue'

const route = useRoute()
const appStore = useAppStore()
</script>

<template>
  <div class="flex flex-1 min-h-0">
    <div class="app-main flex flex-col w-full">
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
    </div>
    <div v-show="appStore.modalSplitActive" class="app-modal-panel flex flex-col">
      <ModalTabs />
      <div id="app-modal-content" class="relative flex-1 overflow-hidden" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.app-modal-panel {
  width: 50%;
}
</style>
