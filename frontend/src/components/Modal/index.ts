import { ref, defineComponent, h, computed, type VNode, shallowRef } from 'vue'

import Modal, { type Props } from './index.vue'

export const useModal = (options: Partial<Props>) => {
  const open = ref(false)
  const props = ref(options)
  const component = shallowRef<VNode>()

  const modal = defineComponent({
    setup() {
      const mergedProps = computed(() => ({
        ...props.value,
        open: open.value,
        'onUpdate:open': (val: boolean) => (open.value = val),
      }))
      return () => h(Modal, mergedProps.value, () => component.value)
    },
  })

  const api = {
    open: () => (open.value = true),
    close: () => (open.value = false),
    setProps(options: Partial<Props> & Recordable) {
      props.value = options
      return this
    },
    setComponent(comp: VNode) {
      component.value = comp
      return this
    },
  }

  return [modal, api] as const
}
