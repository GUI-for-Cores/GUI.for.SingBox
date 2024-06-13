import { render, createVNode, type VNode } from 'vue'
import { APP_TITLE, sampleID } from '@/utils'

import MessageComp, { type IconType } from '@/components/Message/index.vue'

interface MessageInstance {
  dom: HTMLDivElement
  vnode: VNode
  timer: number
}

interface MessageContext {
  dom: HTMLElement
  instances: Record<string, MessageInstance>
  update: (id: string, content: string, icon?: IconType) => void
  destroy: (id: string) => void
}

const buildMessage = (icon: IconType, ctx: MessageContext) => {
  return (content: string, duration = 3_000) => {
    const id = sampleID()

    const onClose = () => ctx.destroy(id)
    const vnode = createVNode(MessageComp, { icon, content, onClose })
    const dom = document.createElement('div')
    dom.id = id
    dom.style.cssText = `display: flex; align-items: center; justify-content: center;`

    ctx.instances[id] = {
      dom,
      vnode,
      timer: setTimeout(onClose, duration)
    }

    ctx.dom.appendChild(dom)
    render(vnode, dom)

    return {
      id,
      info: (content: string) => ctx.update(id, content, 'info'),
      warn: (content: string) => ctx.update(id, content, 'warn'),
      error: (content: string) => ctx.update(id, content, 'error'),
      success: (content: string) => ctx.update(id, content, 'success'),
      update: (content: string, icon?: IconType) => ctx.update(id, content, icon),
      destroy: onClose
    }
  }
}

class Message implements MessageContext {
  public dom: HTMLElement
  public instances: Record<string, MessageInstance>

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

  public info = buildMessage('info', this)
  public warn = buildMessage('warn', this)
  public error = buildMessage('error', this)
  public success = buildMessage('success', this)

  public update = (id: string, content: string, icon?: IconType) => {
    const instance = this.instances[id]
    if (instance) {
      icon && (instance.vnode.component!.props.icon = icon)
      content && (instance.vnode.component!.props.content = content)
    }
  }

  public destroy = (id: string) => {
    const instance = this.instances[id]
    if (instance) {
      render(null, instance.dom)
      instance.dom.remove()
      clearTimeout(instance.timer)
      delete this.instances[id]
    }
  }
}

export const useMessage = () => {
  const message = new Message()

  return { message }
}
