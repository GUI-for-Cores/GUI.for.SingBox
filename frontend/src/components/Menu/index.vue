<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch, nextTick, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Menu } from '@/types/app'

interface Props {
  position: { x: number; y: number }
  menuList: Menu[]
}

const model = defineModel<boolean>({ default: false })
const props = defineProps<Props>()

const secondaryMenu = ref<Menu[] | undefined>()

const menuRef = useTemplateRef('menuRef')
const secondaryMenuRef = useTemplateRef('secondaryMenuRef')

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
  const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuRef.value!

  if (x + menuWidth > clientWidth) left -= x + menuWidth - clientWidth + 8
  if (y + menuHeight > clientHeight) top -= y + menuHeight - clientHeight + 8

  menuPosition.value = { left: left + 'px', top: top + 'px' }
}

const fixSecondaryMenuPos = () => {
  const { x, y } = props.position
  const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuRef.value!

  let left = menuWidth
  let top = menuHeight

  const { offsetWidth: clientWidth, offsetHeight: clientHeight } = document.body
  const { offsetWidth: sMenuWidth, offsetHeight: sMenuHeight } = secondaryMenuRef.value!

  if (left + sMenuWidth + x > clientWidth) left -= x + menuWidth + sMenuWidth - clientWidth + 8
  if (top + sMenuHeight + y > clientHeight) top -= sMenuHeight

  secondaryMenuPosition.value = { left: left + 'px', top: top + 'px' }
}

watch(
  () => props.position,
  ({ x, y }) => {
    nextTick(() => fixMenuPos(x, y))
    secondaryMenu.value = undefined
  },
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
    <div
      v-show="model"
      ref="menuRef"
      :style="menuPosition"
      class="gui-menu fixed z-9999 p-4 rounded-6 shadow flex flex-col gap-4 backdrop-blur-sm"
    >
      <template v-for="menu in menuList">
        <Divider v-if="menu.separator" :key="menu.label + '_divider'">{{ t(menu.label) }}</Divider>
        <Button
          v-else
          :key="menu.label"
          type="text"
          size="small"
          @click="handleClick(menu)"
          @mouseenter="secondaryMenu = menu.children"
        >
          <div class="text-nowrap">
            {{ t(menu.label) }}
          </div>
          <Icon v-if="menu.children" icon="arrowRight" class="ml-8" />
        </Button>
      </template>
      <Transition name="menu">
        <div
          v-show="secondaryMenu"
          ref="secondaryMenuRef"
          :style="secondaryMenuPosition"
          class="gui-menu absolute fixed z-999 p-4 rounded-6 shadow flex flex-col gap-4 backdrop-blur-sm"
        >
          <Button
            v-for="m in secondaryMenu"
            :key="m.label"
            type="text"
            size="small"
            @click.stop="handleClick(m)"
          >
            <Divider v-if="m.separator" :key="m.label + '_divider'" size="small">
              {{ t(m.label) }}
            </Divider>
            <div v-else class="text-nowrap">{{ t(m.label) }}</div>
          </Button>
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

.gui-menu {
  background: var(--menu-bg);
  min-width: 90px;
}
</style>
