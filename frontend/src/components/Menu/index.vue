<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'

import type { Menu } from '@/stores'

interface Props {
  position: { x: number; y: number }
  menuList: Menu[]
}

const model = defineModel<boolean>({ default: false })
const props = defineProps<Props>()

const secondaryMenu = ref<Menu[] | undefined>()

const menuRef = ref()
const secondaryMenuRef = ref()

const menuPosition = ref({ left: '', top: '' })
const secondaryMenuPosition = ref({ left: '', top: '' })

const { t } = useI18n()

const handleClick = (fn: Menu) => {
  fn.handler?.()
  model.value = false
  secondaryMenu.value = undefined
}

const fixMenuPos = (x: number, y: number) => {
  let left = x
  let top = y

  const { offsetWidth: clientWidth, offsetHeight: clientHeight } = document.body
  const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuRef.value

  if (x + menuWidth > clientWidth) left -= x + menuWidth - clientWidth + 8
  if (y + menuHeight > clientHeight) top -= y + menuHeight - clientHeight + 8

  menuPosition.value = { left: left + 'px', top: top + 'px' }
}

const fixSecondaryMenuPos = () => {
  const { x, y } = props.position
  const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuRef.value

  let left = menuWidth
  let top = menuHeight

  const { offsetWidth: clientWidth, offsetHeight: clientHeight } = document.body
  const { offsetWidth: sMenuWidth, offsetHeight: sMenuHeight } = secondaryMenuRef.value

  if (left + sMenuWidth + x > clientWidth) left -= x + menuWidth + sMenuWidth - clientWidth + 8
  if (top + sMenuHeight + y > clientHeight) top -= sMenuHeight

  secondaryMenuPosition.value = { left: left + 'px', top: top + 'px' }
}

watch(
  () => props.position,
  ({ x, y }) => {
    nextTick(() => fixMenuPos(x, y))
    secondaryMenu.value = undefined
  }
)

watch([() => secondaryMenu.value, () => props.position], () => {
  nextTick(fixSecondaryMenuPos)
})

const onClick = () => {
  model.value = false
  secondaryMenu.value = undefined
}

onMounted(() => document.addEventListener('click', onClick))
onUnmounted(() => document.removeEventListener('click', onClick))
</script>

<template>
  <Transition name="menu">
    <div v-show="model" ref="menuRef" :style="menuPosition" class="menu">
      <template v-for="menu in menuList">
        <Divider v-if="menu.separator" :key="menu.label + '_divider'">{{ t(menu.label) }}</Divider>
        <div
          v-else
          :key="menu.label"
          @click="handleClick(menu)"
          @mouseenter="secondaryMenu = menu.children"
          class="menu-item"
        >
          {{ t(menu.label) }}
          <Icon v-if="menu.children" icon="arrowRight" class="ml-8" />
        </div>
      </template>
      <Transition name="menu">
        <div
          v-show="secondaryMenu"
          ref="secondaryMenuRef"
          :style="secondaryMenuPosition"
          class="secondary menu"
        >
          <div
            v-for="m in secondaryMenu"
            :key="m.label"
            @click.stop="handleClick(m)"
            class="menu-item"
          >
            {{ t(m.label) }}
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.menu-enter-active,
.menu-leave-active {
  transition:
    transform 0.2s ease-in-out,
    opacity 0.2s ease-in-out;
  transform-origin: top;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

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
