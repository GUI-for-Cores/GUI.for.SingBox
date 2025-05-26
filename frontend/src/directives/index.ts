import { vDraggable } from 'vue-draggable-plus'

import menu from './menu'
import tips from './tips'

import type { Plugin, App } from 'vue'

const directives: any = {
  menu,
  tips,
  draggable: vDraggable,
}

export default {
  install(app: App) {
    Object.keys(directives).forEach((key) => {
      app.directive(key, directives[key])
    })
  },
} as Plugin
