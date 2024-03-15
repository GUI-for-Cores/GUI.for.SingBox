import { render, createVNode, type VNode } from 'vue'
import { APP_TITLE, sampleID } from '@/utils'

import MessageComp, { type IconType } from '@/components/Message/index.vue'

const createMessage = (
  icon: IconType,
  content: string,
  duration: number,
  parent: HTMLElement,
  instances: Record<string, { dom: HTMLDivElement; vnode: VNode }>
) => {
  const id = sampleID()
  const dom = document.createElement('div')
  const vnode = createVNode(MessageComp, { icon, content })

  dom.id = id
  dom.style.cssText = `display: flex; align-items: center; justify-content: center;`
  instances[id] = { dom, vnode }
  parent.appendChild(dom)
  render(vnode, dom)

  setTimeout(() => {
    dom.remove()
    delete instances[id]
  }, duration)

  return id
}

class Message {
  private dom: HTMLElement
  private instances: { [key: string]: { dom: HTMLDivElement; vnode: VNode } }
  private t: any
  constructor() {
    const ID = APP_TITLE + '-toast'
    this.dom = document.getElementById(ID) || document.createElement('div')
    this.dom.id = ID
    this.dom.style.cssText = `
      position: fixed;
      z-index: 999999;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
    `
    document.body.appendChild(this.dom)
    this.instances = {}
  }

  public info = (content: string, duration = 3_000) => ({
    id: createMessage('info', content, duration, this.dom, this.instances)
  })

  public warn = (content: string, duration = 3_000) => ({
    id: createMessage('warn', content, duration, this.dom, this.instances)
  })

  public error = (content: string, duration = 3_000) => ({
    id: createMessage('error', content, duration, this.dom, this.instances)
  })

  public success = (content: string, duration = 3_000) => ({
    id: createMessage('success', content, duration, this.dom, this.instances)
  })

  public update = (id: string, content: string, icon?: IconType) => {
    const instance = this.instances[id]
    if (instance) {
      icon && (instance.vnode.component!.props.icon = icon)
      content && (instance.vnode.component!.props.content = content)
    }
  }

  public destroy = (id: string) => {
    if (this.instances[id]) {
      this.instances[id].dom.remove()
    }
  }
}

export const useMessage = () => {
  const message = new Message()

  return { message }
}
