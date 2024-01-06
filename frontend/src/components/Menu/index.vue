<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { onMounted, onUnmounted, ref, computed } from 'vue'

import type { Menu } from '@/stores'

interface Props {
  position: { x: number; y: number }
  menuList: Menu[]
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), { modelValue: false })

const emits = defineEmits(['update:modelValue'])

const hoverItemKey = ref('s')

const { t } = useI18n()

const handleClick = (fn: Menu) => {
  fn.handler?.()
  hoverItemKey.value = ''
  emits('update:modelValue', false)
}

const menuPosition = computed(() => ({
  left: props.position.x + 'px',
  top: props.position.y + 'px'
}))

const onClick = () => {
  hoverItemKey.value = ''
  emits('update:modelValue', false)
}

onMounted(() => document.addEventListener('click', onClick))
onUnmounted(() => document.removeEventListener('click', onClick))
</script>

<template>
  <div v-show="modelValue" :style="menuPosition" class="menu">
    <template v-for="menu in menuList">
      <Divider v-if="menu.separator" :key="menu.label + '_divider'">{{ t(menu.label) }}</Divider>

      <div
        v-else
        :key="menu.label"
        @click="handleClick(menu)"
        @mouseenter="hoverItemKey = menu.label"
        class="menu-item"
      >
        {{ t(menu.label) }}

        <template v-if="menu.children">
          <Icon icon="arrowRight" style="margin-left: 8px" />

          <div v-if="hoverItemKey === menu.label" class="secondary menu">
            <div
              v-for="m in menu.children"
              :key="m.label"
              @click.stop="handleClick(m)"
              @mouseenter="hoverItemKey = menu.label"
              class="menu-item"
            >
              {{ t(m.label) }}
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style lang="less" scoped>
.menu {
  position: fixed;
  z-index: 9999;
  background: var(--menu-bg);
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-width: 90px;
  text-align: center;
  font-size: 12px;

  .menu-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    margin: 4px 0;
    border-radius: 6px;
    white-space: nowrap;
    &:hover {
      background: var(--menu-item-hover);
    }
  }

  .secondary {
    position: absolute;
    z-index: 99999;
    top: 0;
    left: 100%;
  }
}
</style>
