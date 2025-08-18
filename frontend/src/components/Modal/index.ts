import { ref, defineComponent, h, computed, type VNode, type ComponentPublicInstance } from 'vue'

import Modal from './index.vue'

import type { Props as ModalProps, Slots as ModalSlots } from './index.vue'

export const useModal = (options: Partial<ModalProps>, contents: ModalSlots = {}) => {
  const open = ref(false)
  const props = ref(options)
  const slots = ref(contents)

  if ('component' in options && options.component) {
    console.warn(
      '[Deprecated] The "component" option is deprecated. Please use the second parameter instead, e.g. \n{ \n\tdefault: () => any \n}',
    )
    slots.value.default = () => options.component
  }

  const modal = defineComponent({
    setup(_, ctx) {
      const mergedProps = computed(() => ({
        ...props.value,
        ...ctx.attrs,
        open: open.value,
        'onUpdate:open': (val: boolean) => (open.value = val),
      }))
      return () => h(Modal, mergedProps.value, { ...slots.value, ...ctx.slots })
    },
  })

  const api = {
    open: () => (open.value = true),
    close: () => (open.value = false),
    setProps(options: Partial<ModalProps> & Recordable) {
      props.value = options
      return this
    },
    patchProps(options: Partial<ModalProps> & Recordable) {
      Object.assign(props.value, options)
      return this
    },
    setSlots(_slots: ModalSlots) {
      slots.value = _slots
      return this
    },
    patchSlots(_slots: ModalSlots) {
      Object.assign(slots.value, _slots)
      return this
    },
    setContent<C extends new (...args: any) => any>(
      Comp: C,
      _props?: InstanceType<C>['$props'],
      _slots?: InstanceType<C>['$slots'],
      replace = true,
    ) {
      const defaultSlot = () =>
        h(
          Comp,
          {
            ..._props,
            ref: (el: ComponentPublicInstance<{ modalSlots: ModalSlots }> | null) => {
              if (el?.modalSlots) this.patchSlots(el?.modalSlots || {})
            },
          },
          _slots,
        )
      if (replace) {
        slots.value = { default: defaultSlot }
      } else {
        slots.value.default = defaultSlot
      }
      return this
    },
    // Compatibility code
    setComponent(comp: VNode) {
      console.warn('[Deprecated] "setComponent" is deprecated. Please use "setContent" instead.')
      slots.value.default = () => comp
      return this
    },
  }

  return [modal, api] as const
}
