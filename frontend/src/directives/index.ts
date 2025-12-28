import { vDraggable } from 'vue-draggable-plus'

import menu from './menu'
import platform from './platform'
import tips from './tips'

import type { Plugin, App } from 'vue'

const directives: any = {
  menu,
  tips,
  platform,
  draggable: vDraggable,
}

export default {
  install(app: App) {
    Object.keys(directives).forEach((key) => {
      app.directive(key, directives[key])
    })
  },
} as Plugin
