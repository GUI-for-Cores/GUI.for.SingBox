import { useI18n } from 'vue-i18n'

import i18n from '@/lang'

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)))
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))

  return `${formattedValue} ${sizes[i]}`
}

export function formatRelativeTime(d: string) {
  const diffInMilliseconds = new Date().getTime() - new Date(d).getTime()
  const seconds = Math.abs(Math.floor(diffInMilliseconds / 1000))
  const minutes = Math.abs(Math.floor(seconds / 60))
  const hours = Math.abs(Math.floor(minutes / 60))
  const days = Math.abs(Math.floor(hours / 24))
  const months = Math.abs(Math.floor(days / 30))
  const years = Math.abs(Math.floor(months / 12))

  const { t } = useI18n()

  const prefix = i18n.global.locale.value === 'en' ? ' ' : ''

  const suffix =
    (i18n.global.locale.value === 'en' ? ' ' : '') +
    (diffInMilliseconds >= 0 ? t('format.ago') : t('format.later'))

  if (seconds < 60) {
    const s = seconds > 1 ? t('format.seconds') : t('format.second')
    return `${seconds}${prefix}${s}${suffix}`
  } else if (minutes < 60) {
    const m = minutes > 1 ? t('format.minutes') : t('format.minute')
    return `${minutes}${prefix}${m}${suffix}`
  } else if (hours < 24) {
    const h = hours > 1 ? t('format.hours') : t('format.hour')
    return `${hours}${prefix}${h}${suffix}`
  } else if (days < 30) {
    const d = days > 1 ? t('format.days') : t('format.day')
    return `${days}${prefix}${d}${suffix}`
  } else if (months < 12) {
    const m = months > 1 ? t('format.months') : t('format.month')
    return `${months}${prefix}${m}${suffix}`
  } else {
    const y = years > 1 ? t('format.years') : t('format.year')
    return `${years}${prefix}${y}${suffix}`
  }
}
