import { createI18n } from 'vue-i18n'

import en from './locale/en'
import fa from './locale/fa'
import ru from './locale/ru'
import zh from './locale/zh'

const messages = {
  zh,
  en,
  ru,
  fa,
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackWarn: false,
  missingWarn: false,
  messages,
})

export default i18n
