import 'vue-router'

import { type IconType } from '@/components/Icon/index.vue'

declare module 'vue-router' {
  interface RouteMeta {
    name: string
    icon?: IconType
    hidden?: boolean
  }
}
