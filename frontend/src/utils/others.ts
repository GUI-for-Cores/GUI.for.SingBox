import { useAppSettingsStore } from '@/stores'
import { APP_TITLE, APP_VERSION } from '@/utils'

export const deepClone = <T>(json: T): T => JSON.parse(JSON.stringify(json))

export const omit = <T, K extends keyof T>(obj: T, fields: K[]): Omit<T, K> => {
  const _obj = deepClone(obj)
  fields.forEach((field) => {
    delete _obj[field]
  })
  return _obj
}

export const omitArray = <T, K extends keyof T>(arr: T[], fields: K[]): Omit<T, K>[] => {
  return arr.map((obj) => {
    const item: Partial<T> = deepClone(obj)
    fields.forEach((key) => {
      delete item[key]
    })
    return item as Omit<T, K>
  })
}
export const debounce = (fn: (...args: any) => any, wait: number) => {
  let timer: null | number = null
  const _debuonce = function (...args: any) {
    return new Promise((resolve, reject) => {
      timer && clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          await fn(...args)
          resolve(null)
        } catch (error) {
          reject(error)
        }
      }, wait)
    })
  }
  _debuonce.cancel = function () {
    timer && clearTimeout(timer)
    timer = null
  }
  return _debuonce
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const ignoredError = async <T>(fn: (...args: any) => Promise<T>, ...args: any) => {
  try {
    const res = await fn(...args)
    return res
  } catch (error) {
    // console.log(error)
  }
}

export const sampleID = () => 'ID_' + Math.random().toString(36).substring(2, 10)

export const getValue = (obj: Record<string, any>, expr: string) => {
  return expr.split('.').reduce((value, key) => {
    return value[key]
  }, obj)
}

export const getUserAgent = () => {
  const appSettings = useAppSettingsStore()
  return appSettings.app.userAgent || APP_TITLE + '/' + APP_VERSION
}

export const getGitHubApiAuthorization = () => {
  const appSettings = useAppSettingsStore()
  return appSettings.app.githubApiToken ? `Bearer ${appSettings.app.githubApiToken}` : ''
}

export const setIntervalImmediately = (func: () => void, interval: number) => {
  func()
  return setInterval(func, interval)
}

const isPlainObject = (obj: any) => {
  return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
}

export const deepAssign = (...args: any[]) => {
  const len = args.length
  let target = args[0]
  if (!isPlainObject(target)) {
    target = {}
  }
  for (let i = 1; i < len; i++) {
    const source = args[i]
    if (isPlainObject(source)) {
      for (const s in source) {
        if (s === '__proto__' || target === source[s]) {
          continue
        }
        if (isPlainObject(source[s])) {
          target[s] = deepAssign(target[s], source[s])
        } else {
          target[s] = source[s]
        }
      }
    }
  }
  return target
}

export const base64Encode = (str: string) => {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(('0x' + p1) as any)
    )
  )
}

export const base64Decode = (str: string) => {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}
