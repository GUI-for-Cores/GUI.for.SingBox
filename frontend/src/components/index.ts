import type { Plugin, App, Component } from 'vue'

export { default as TitleBar } from './TitleBar.vue'
export { default as NavigationBar } from './NavigationBar.vue'

const Components = import.meta.glob<Component>('./*/index.vue', {
  eager: true,
  import: 'default',
})

export default {
  install: (app: App) => {
    Object.entries(Components).forEach(([path, comp]) => {
      const name = (path.split('/') as [string, string])[1]
      app.component(name, comp)
    })
  },
} as Plugin
