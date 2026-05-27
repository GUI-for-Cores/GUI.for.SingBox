import type { App, AppContext, VNode } from 'vue'

let appContext: AppContext | null = null

export const setAppContext = (app: App) => {
  appContext = app._context
}

export const getAppContext = () => {
  if (!appContext) {
    throw new Error('Application context has not been initialized yet.')
  }

  return appContext
}

export const bindAppContext = (vnode: VNode) => {
  vnode.appContext = getAppContext()
}
