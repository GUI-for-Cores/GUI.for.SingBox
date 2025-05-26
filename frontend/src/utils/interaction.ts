import { render, createVNode, type VNode } from 'vue'

import i18n from '@/lang'
import { APP_TITLE, sampleID } from '@/utils'

import ConfirmComp, { type ConfirmOptions } from '@/components/Confirm/index.vue'
import { type Props as InputProps } from '@/components/Input/index.vue'
import MessageComp, { type MessageIcon } from '@/components/Message/index.vue'
import PickerComp, { type PickerItem } from '@/components/Picker/index.vue'
import PromptComp from '@/components/Prompt/index.vue'

const ContainerCssText = `
    position: fixed;
    z-index: 99999;
    top: 84px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    max-height: 70%;
`

interface MessageInstance {
  dom: HTMLDivElement
  vnode: VNode
  timer: number
}

class Message {
  public container: HTMLElement
  public instances: Record<string, MessageInstance>

  constructor() {
    const ID = APP_TITLE + '-toast'
    this.container = document.getElementById(ID) || document.createElement('div')
    this.container.id = ID
    this.container.style.cssText = `
        position: fixed;
        z-index: 999999;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
    `
    document.body.appendChild(this.container)
    this.instances = {}
  }

  private buildMessage = (icon: MessageIcon) => {
    return (content: string, duration = 3_000, onClose?: () => void) => {
      const id = sampleID()
      const dom = document.createElement('div')

      const onMouseEnter = () => clearTimeout(this.instances[id].timer)
      const onMouseLeave = () => (this.instances[id].timer = setTimeout(onDestroy, duration))

      const onDestroy = () => {
        dom.removeEventListener('mouseenter', onMouseEnter)
        dom.removeEventListener('mouseleave', onMouseLeave)
        this.destroy(id)
      }

      const initInstance = () => {
        dom.style.cssText = 'display: flex; align-items: center; justify-content: center;'

        const vnode = createVNode(MessageComp, {
          icon,
          content,
          onClose: () => {
            onClose?.()
            onDestroy()
          },
        })

        this.instances[id] = {
          dom,
          vnode,
          timer: setTimeout(onDestroy, duration),
        }

        dom.addEventListener('mouseenter', onMouseEnter)
        dom.addEventListener('mouseleave', onMouseLeave)

        this.container.appendChild(dom)
        render(vnode, dom)
      }

      initInstance()

      return {
        id,
        info: (content: string) => this.update(id, content, 'info'),
        warn: (content: string) => this.update(id, content, 'warn'),
        error: (content: string) => this.update(id, content, 'error'),
        success: (content: string) => this.update(id, content, 'success'),
        update: (content: string, icon?: MessageIcon) => this.update(id, content, icon),
        destroy: onDestroy,
      }
    }
  }

  public info = this.buildMessage('info')
  public warn = this.buildMessage('warn')
  public error = this.buildMessage('error')
  public success = this.buildMessage('success')

  public update = (id: string, content: string, icon?: MessageIcon) => {
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

class Picker {
  constructor() {}

  public single = <T>(title: string, options: PickerItem[], initialValue: string[] = []) => {
    return this.buildPicker<T>('single', title, options, initialValue)
  }

  public multi = <T>(title: string, options: PickerItem[], initialValue: string[] = []) => {
    return this.buildPicker<T>('multi', title, options, initialValue)
  }

  private buildPicker = <T>(
    type: 'single' | 'multi',
    title: string,
    options: PickerItem[],
    initialValue: string[],
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const { t } = i18n.global
      const dom = document.createElement('div')
      dom.style.cssText = ContainerCssText
      const vnode = createVNode(PickerComp, {
        type,
        title,
        options,
        initialValue,
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
}

const buildConfirm = (
  title: string,
  message: string,
  options: ConfirmOptions = { type: 'text' },
  cancel = true,
) => {
  return new Promise((resolve, reject) => {
    const { t } = i18n.global
    const dom = document.createElement('div')
    dom.style.cssText = ContainerCssText
    const vnode = createVNode(ConfirmComp, {
      title,
      message,
      options,
      cancel,
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

export const prompt = <T>(
  title: string,
  initialValue: string | number = '',
  props: Partial<InputProps> = {},
) => {
  const { t } = i18n.global

  return new Promise<T>((resolve, reject) => {
    const dom = document.createElement('div')
    dom.style.cssText = ContainerCssText
    const vnode = createVNode(PromptComp, {
      title,
      initialValue,
      props,
      onSubmit: resolve,
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

export const alert = (
  title: string,
  message: string,
  options: ConfirmOptions = { type: 'text' },
) => {
  return buildConfirm(title, message, options, false)
}

export const confirm = (
  title: string,
  message: string,
  options: ConfirmOptions = { type: 'text' },
) => {
  return buildConfirm(title, message, options)
}

export const picker = new Picker()

export const message = new Message()
