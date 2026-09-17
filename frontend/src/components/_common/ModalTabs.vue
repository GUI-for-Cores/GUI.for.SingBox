<script setup lang="ts">
import { useAppStore } from '@/stores'

const appStore = useAppStore()
</script>

<template>
  <div class="flex px-8 pt-6 overflow-x-auto" style="--wails-draggable: drag">
    <Button
      v-for="item in appStore.modalTabs"
      :key="item.id"
      :type="item.id === appStore.activeModalTab ? 'link' : 'text'"
      class="app-modal-tab min-w-0"
      @click="item.activate"
      @mousedown.middle.prevent
      @auxclick.middle.prevent.stop="item.close"
    >
      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
        {{ $t(item.title()) }}
      </span>
      <Button
        type="text"
        size="small"
        icon="close"
        :icon-size="12"
        style="--wails-draggable: no-drag"
        @click.stop="item.close"
      />
    </Button>
  </div>
</template>

<style lang="less" scoped>
.app-modal-tab {
  flex: 1 0 100px;
  max-width: 200px;
}
</style>
