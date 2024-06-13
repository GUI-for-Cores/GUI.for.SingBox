import { render, createVNode } from 'vue'

import PromptComp from '@/components/Prompt/index.vue'
import { type Props as InputProps } from '@/components/Input/index.vue'

const createPrompt = <T>(
  title: string,
  initialValue: string | number = '',
  props: Partial<InputProps> = {}
) => {
  return new Promise<T>((resolve, reject) => {
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
    const vnode = createVNode(PromptComp, {
      title,
      initialValue,
      props,
      onSubmit: resolve,
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

export const usePrompt = () => {
  const prompt = createPrompt

  return { prompt }
}
