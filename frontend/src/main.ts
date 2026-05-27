import { createPinia } from 'pinia'
import { createApp } from 'vue'

import './assets/main.less'
import './assets/polyfills'
import './assets/globalMethods'
import App from './App.vue'
import components from './components'
import directives from './directives'
import i18n from './lang'
import router from './router'
import { setAppContext } from './utils'

const app = createApp(App)

setAppContext(app)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(components)
app.use(directives)

app.mount('#app')
