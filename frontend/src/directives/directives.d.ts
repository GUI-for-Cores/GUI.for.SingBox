import type { vDraggable } from 'vue-draggable-plus'

import type menu from './menu'
import type platform from './platform'
import type tips from './tips'

declare module 'vue' {
  interface GlobalDirectives {
    vDraggable: typeof vDraggable
    vMenu: typeof menu
    vTips: typeof tips
    vPlatform: typeof platform
  }
}
