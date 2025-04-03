import type { Plugin, App, Component } from 'vue'

export { default as MainPage } from './MainPage.vue'
export { default as TitleBar } from './TitleBar.vue'
export { default as NavigationBar } from './NavigationBar.vue'

const Components = import.meta.glob<Component>('./*/index.vue', {
  eager: true,
  import: 'default',
})

export default {
  install: (app: App) => {
    for (const path in Components) {
      const name = path.split('/')[1]
      app.component(name, Components[path])
    }
  },
} as Plugin
