import type { Plugin, App, Component } from 'vue'

export { default as MainPage } from './MainPage.vue'
export { default as TitleBar } from './TitleBar.vue'
export { default as NavigationBar } from './NavigationBar.vue'

type GlobFuncType = Record<string, { default: Component }>

const Components: GlobFuncType = import.meta.glob('./*/index.vue', { eager: true })

export default {
  install: (app: App) => {
    for (const path in Components) {
      const name = path.split('/')[1]
      app.component(name, Components[path].default)
    }
  }
} as Plugin
