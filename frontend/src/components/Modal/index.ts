import { ref, defineComponent, h, computed, type VNode } from 'vue'

import Modal, { type Props, type Slots } from './index.vue'

export const useModal = (options: Partial<Props>, contents: Slots = {}) => {
  const open = ref(false)
  const props = ref(options)
  const slots = ref(contents)

  // Compatibility code
  // @ts-expect-error(Deprecated)
  if (options.component) {
    // @ts-expect-error(Deprecated)
    slots.value.default = () => options.component
  }

  const modal = defineComponent({
    setup(_props, _ctx) {
      const mergedProps = computed(() => ({
        ...props.value,
        ..._props,
        open: open.value,
        'onUpdate:open': (val: boolean) => (open.value = val),
      }))
      return () => h(Modal, mergedProps.value, { ...slots.value, ..._ctx.slots })
    },
  })

  const api = {
    open: () => (open.value = true),
    close: () => (open.value = false),
    setProps(options: Partial<Props> & Recordable) {
      props.value = options
      return this
    },
    patchProps(options: Partial<Props> & Recordable) {
      Object.assign(props.value, options)
      return this
    },
    setSlots(_slots: Slots) {
      slots.value = _slots
      return this
    },
    patchSlots(_slots: Slots) {
      Object.assign(slots.value, _slots)
      return this
    },
    setContent<C extends new (...args: any) => any>(Comp: C, props?: InstanceType<C>['$props']) {
      const contentRef = ref()
      slots.value = {
        default: () =>
          h(Comp, {
            ...props,
            ref: contentRef,
            onVnodeMounted: () => {
              this.patchSlots(contentRef.value?.modalSlots || {})
            },
          }),
      }
      return this
    },
    // Compatibility code
    setComponent(comp: VNode) {
      slots.value.default = () => comp
      return this
    },
  }

  return [modal, api] as const
}
