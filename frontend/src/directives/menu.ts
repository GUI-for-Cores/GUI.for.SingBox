import { useAppStore } from '@/stores'
import { sleep } from '@/utils'

import type { Directive, DirectiveBinding } from 'vue'

const updateMenus = (el: any, binding: DirectiveBinding) => {
  const appStore = useAppStore()

  el.oncontextmenu = async (e: MouseEvent) => {
    e.preventDefault()
    if (binding.value.length) {
      appStore.menuPosition = { x: e.clientX, y: e.clientY }
      appStore.menuList = binding.value
      if (appStore.menuShow) {
        appStore.menuShow = false
        await sleep(200)
      }
      appStore.menuShow = true
    }
  }
}

export default {
  mounted(el: any, binding: DirectiveBinding) {
    updateMenus(el, binding)
  },
  updated(el: any, binding: DirectiveBinding) {
    updateMenus(el, binding)
  },
} as Directive
