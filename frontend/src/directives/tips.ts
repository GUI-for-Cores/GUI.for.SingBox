import { type Directive, type DirectiveBinding } from 'vue'

import { debounce } from '@/utils'
import { useAppStore } from '@/stores'

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const appStore = useAppStore()

    const delay = binding.modifiers.fast ? 200 : 500

    const show = debounce((x: number, y: number) => {
      if (el.dataset.showTips === 'true') {
        appStore.tipsPosition = { x, y }
        appStore.tipsMessage = binding.value
        appStore.tipsShow = true
      }
    }, delay)

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
    const appStore = useAppStore()
    appStore.tipsShow = false
    el.dataset.showTips = 'false'
  }
} as Directive
