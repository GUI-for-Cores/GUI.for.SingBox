import { render, createVNode } from 'vue'

import PickerComp from '@/components/Picker/index.vue'

type PickerItem = { label: string; value: string }

const createPicker = (
  type: 'single' | 'multi',
  title: string,
  options: PickerItem[],
  initialValue: string[]
) => {
  return new Promise((resolve, reject) => {
    const dom = document.createElement('div')
    dom.style.cssText = `
      position: fixed;
      z-index: 99999;
      top: 84px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
    `
    const vnode = createVNode(PickerComp, {
      type,
      title,
      options,
      initialValue,
      onConfirm: resolve,
      onCancel: () => reject('cancelled'),
      onFinish: () => dom.remove()
    })
    document.body.appendChild(dom)
    render(vnode, dom)
  })
}

class Picker {
  constructor() {}

  public single = (title: string, options: PickerItem[], initialValue: string[] = []) =>
    createPicker('single', title, options, initialValue)

  public multi = (title: string, options: PickerItem[], initialValue: string[] = []) =>
    createPicker('multi', title, options, initialValue)
}

export const usePicker = () => {
  const picker = new Picker()

  return { picker }
}
