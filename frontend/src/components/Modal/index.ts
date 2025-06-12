import { ref, defineComponent, h, computed, type VNode, shallowRef } from 'vue'

import { omit } from '@/utils'

import Modal, { type Props } from './index.vue'

export interface UseModalOptions extends Partial<Props> {
  component?: VNode
}

export const useModal = (options: UseModalOptions) => {
  const open = ref(false)
  const props = ref(omit(options, ['component']))
  const component = shallowRef<VNode | undefined>(options.component)

  const modal = defineComponent({
    setup(_, { slots }) {
      const mergedProps = computed(() => ({
        ...props.value,
        open: open.value,
        'onUpdate:open': (val: boolean) => (open.value = val),
      }))

      return () =>
        h(Modal, mergedProps.value, {
          default: () => component.value,
          action: () => slots.action?.(),
        })
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
