import { createI18n } from 'vue-i18n'

import zh from './locale/zh'
import en from './locale/en'

const messages = {
  zh,
  en
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackWarn: false,
  missingWarn: false,
  messages
})

export default i18n
