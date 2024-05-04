import type { Directive, DirectiveBinding } from 'vue'

import { sleep } from '@/utils'
import { useAppStore } from '@/stores'

export default {
  mounted(el: any, binding: DirectiveBinding) {
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
} as Directive
