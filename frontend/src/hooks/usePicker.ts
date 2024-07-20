import { render, createVNode } from 'vue'

import PickerComp from '@/components/Picker/index.vue'

export type PickerItem = { label: string; value: string; description?: string }

const createPicker = <T>(
  type: 'single' | 'multi',
  title: string,
  options: PickerItem[],
  initialValue: string[]
): Promise<T> => {
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
      onFinish: () => {
        render(null, dom)
        dom.remove()
      }
    })
    document.body.appendChild(dom)
    render(vnode, dom)
  })
}

class Picker {
  constructor() {}

  public single = <T>(title: string, options: PickerItem[], initialValue: string[] = []) =>
    createPicker<T>('single', title, options, initialValue)

  public multi = <T>(title: string, options: PickerItem[], initialValue: string[] = []) =>
    createPicker<T>('multi', title, options, initialValue)
}

export const usePicker = () => {
  const picker = new Picker()

  return { picker }
}
