import { useEnvStore } from '@/stores'

import type { Directive, DirectiveBinding } from 'vue'

export default {
  mounted(el: any, binding: DirectiveBinding) {
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
} as Directive
