import { createI18n } from 'vue-i18n'

import zh from './locale/zh'
import en from './locale/en'
import ru from './locale/ru'
import fa from './locale/fa'
import { watch } from 'vue';

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

// Use watch to monitor changes to locale
watch(
  () => i18n.global.locale.value, // Access the actual locale value
  (newLocale) => {
    const htmlTag = document.documentElement;
    if (newLocale === 'fa') {
      htmlTag.setAttribute('dir', 'rtl'); // Set direction to right-to-left for Persian
    } else {
      htmlTag.setAttribute('dir', 'ltr'); // Set direction to left-to-right for other languages
    }
  },
  { immediate: true } // Apply the change immediately when the app starts
)
export default i18n
