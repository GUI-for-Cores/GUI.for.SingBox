import { render, createVNode } from 'vue'

import ConfirmComp from '@/components/Confirm/index.vue'

const createAlert = (title: string, message: string) => {
  return new Promise((resolve) => {
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
    const vnode = createVNode(ConfirmComp, {
      title,
      message,
      cancel: false,
      onConfirm: resolve,
      onFinish: () => {
        render(null, dom)
        dom.remove()
      }
    })
    document.body.appendChild(dom)
    render(vnode, dom)
  })
}

export const useAlert = () => {
  const alert = createAlert

  return { alert }
}
