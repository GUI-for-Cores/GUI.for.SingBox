import { type Directive, type DirectiveBinding } from 'vue'

import { useApp } from '@/stores'
import { debounce } from '@/utils'

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const appStore = useApp()

    const show = debounce((x: number, y: number) => {
      if (el.dataset.showTips === 'true') {
        appStore.tipsPosition = { x, y }
        appStore.tipsMessage = binding.value
        appStore.tipsShow = true
      }
    }, 1000)

    el.onmouseenter = (e: MouseEvent) => {
      el.dataset.showTips = 'true'
      show(e.clientX, e.clientY)
    }

    el.onmouseleave = () => {
      appStore.tipsShow = false
      el.dataset.showTips = 'false'
    }
  },
  beforeUnmount(el: HTMLElement) {
    const appStore = useApp()
    appStore.tipsShow = false
    el.dataset.showTips = 'false'
  }
} as Directive
