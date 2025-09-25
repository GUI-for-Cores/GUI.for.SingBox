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

export const reloadLocale = async (locale = i18n.global.locale.value) => {
  if (!['zh', 'en'].includes(locale)) {
    const messages = await ReadFile(`${LocalesFilePath}/${locale}.json`).catch(() => '')
    messages && i18n.global.setLocaleMessage(locale, JSON.parse(messages))
  }
}

export const loadLocaleMessages = async (locale: string) => {
  if (!i18n.global.availableLocales.includes(locale)) {
    await reloadLocale(locale)
  }
}

export default i18n
