import type { Directive } from 'vue'

import { useEnvStore } from '@/stores'

export default {
  mounted(el, binding) {
    const envStore = useEnvStore()
    const supports = binding.value
    if (!supports.includes(envStore.env.os)) {
      el.style.display = 'none'
    }
  },
  updated(el, binding) {
    const envStore = useEnvStore()
    const supports = binding.value
    el.style.display = supports.includes(envStore.env.os) ? '' : 'none'
  },
} satisfies Directive<HTMLElement, App.OS[]>
