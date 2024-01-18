import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './assets/main.less'
import './globalMethods'

import App from './App.vue'
import router from './router'
import i18n from './lang'
import components from './components'
import directives from './directives'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(components)
app.use(directives)

app.mount('#app')
