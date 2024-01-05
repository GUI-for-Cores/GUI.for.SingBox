import type { Directive, DirectiveBinding } from 'vue'

import { useApp } from '@/stores'

export default {
  mounted(el: any, binding: DirectiveBinding) {
    const appStore = useApp()

    el.oncontextmenu = (e: MouseEvent) => {
      e.preventDefault()
      if (binding.value.length) {
        appStore.menuPosition = { x: e.clientX, y: e.clientY }
        appStore.menuList = binding.value
        appStore.menuShow = true
      }
    }
  }
} as Directive
