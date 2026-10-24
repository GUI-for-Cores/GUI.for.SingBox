import { type Directive } from 'vue'

import { useAppStore } from '@/stores'
import { debounce } from '@/utils'

export default {
  mounted(el, binding) {
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
      if (binding.value) {
        el.dataset.showTips = 'true'
        show(e.clientX, e.clientY)
      }
    }

    el.onmouseleave = () => {
      appStore.tipsShow = false
      el.dataset.showTips = 'false'
    }
  },
  beforeUnmount(el) {
    const appStore = useAppStore()
    appStore.tipsShow = false
    el.dataset.showTips = 'false'
  },
} satisfies Directive<HTMLElement, string>
