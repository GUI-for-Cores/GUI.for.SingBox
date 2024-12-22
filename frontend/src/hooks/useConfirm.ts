import { render, createVNode } from 'vue'

import i18n from '@/lang'
import ConfirmComp, { type Options } from '@/components/Confirm/index.vue'

const createConfirm = (title: string, message: string, options: Options = { type: 'text' }) => {
  const { t } = i18n.global

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
      max-height: 70%;
    `
    const vnode = createVNode(ConfirmComp, {
      title,
      message,
      options,
      onConfirm: resolve,
      onCancel: () => reject(t('common.canceled')),
      onFinish: () => {
        render(null, dom)
        dom.remove()
      },
    })
    document.body.appendChild(dom)
    render(vnode, dom)
  })
}

export const useConfirm = () => {
  const confirm = createConfirm

  return { confirm }
}
