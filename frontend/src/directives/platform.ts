import { useEnvStore } from '@/stores'

import type { Directive, DirectiveBinding } from 'vue'

export default {
  mounted(el: any, binding: DirectiveBinding) {
    const envStore = useEnvStore()
    const supports = binding.value
    if (!supports.includes(envStore.env.os)) {
      el.remove()
    }
  },
} as Directive
