import { createI18n } from 'vue-i18n'

import { ReadFile } from '@/bridge'
import { LocalesFilePath } from '@/constant/app'

import en from './locale/en'
import zh from './locale/zh'

const messages: { [key: string]: Recordable } = {
  zh,
  en,
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackWarn: false,
  missingWarn: false,
  messages,
})

export const loadLocaleMessages = async (locale: string) => {
  if (!i18n.global.availableLocales.includes(locale)) {
    const messages = await ReadFile(`${LocalesFilePath}/${locale}.json`)
    i18n.global.setLocaleMessage(locale, JSON.parse(messages))
  }
}

export default i18n
