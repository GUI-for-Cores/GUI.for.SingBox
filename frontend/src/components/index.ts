import type { Plugin, App, Component } from 'vue'

export { default as TitleBar } from './_common/TitleBar.vue'
export { default as NavigationBar } from './_common/NavigationBar.vue'
export { default as SplashView } from './_common/SplashView.vue'
export { default as AboutView } from './_common/AboutView.vue'
export { default as CommandView } from './_common/CommandView.vue'

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
