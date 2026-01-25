import { createI18n } from 'vue-i18n'

import { ReadFile } from '@/bridge'
import { LocalesFilePath } from '@/constant/app'
import { Lang } from '@/enums/app'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackWarn: false,
  missingWarn: false,
  messages: {},
})

export const loadLocale = async (locale = i18n.global.locale.value) => {
  if ([Lang.ZH, Lang.EN].includes(locale as Lang)) {
    const message = await import(`./locale/${locale}.ts`)
    i18n.global.setLocaleMessage(locale, message.default)
  } else {
    const message = await ReadFile(`${LocalesFilePath}/${locale}.json`).catch(() => '')
    message && i18n.global.setLocaleMessage(locale, JSON.parse(message))
  }
}

export default i18n
