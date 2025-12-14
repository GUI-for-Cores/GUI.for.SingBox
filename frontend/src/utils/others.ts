import { stringify } from 'yaml'

import { useAppSettingsStore, useEnvStore } from '@/stores'
import { APP_TITLE, APP_VERSION } from '@/utils'

export const deepClone = <T>(json: T): T => JSON.parse(JSON.stringify(json))

export const omit = <T extends object, K extends keyof T>(obj: T, props: K[]): Omit<T, K> => {
  const result = {} as T
  const omitSet = new Set(props)
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (!omitSet.has(key as unknown as K)) {
        result[key] = obj[key]
      }
    }
  }
  return result as Omit<T, K>
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

export const ignoredError = async <F extends (...args: any[]) => Promise<any>>(
  fn: F,
  ...args: Parameters<F>
): Promise<ReturnType<F> | undefined> => {
  try {
    return await fn(...args)
  } catch {
    return undefined
  }
}

export const sampleID = () => 'ID_' + Math.random().toString(36).substring(2, 10)

export const generateSecureKey = (bits = 256) => {
  const bytes = bits / 8
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const getValue = <T = unknown>(obj: unknown, expr: string): T | undefined => {
  return expr.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[key]
    }
    return undefined
  }, obj) as T
}

type IteratorFn<T, K> = (item: T, array: T[]) => Promise<K>
type PoolController = { pause: () => void; resume: () => void; cancel: () => void }
interface RunPoolOptions {
  shouldPause?: () => Promise<void>
  shouldCancel?: () => boolean
}

async function runPool<T, K>(
  poolLimit: number,
  array: T[],
  iteratorFn: IteratorFn<T, K>,
  options: RunPoolOptions = {},
) {
  const results: Promise<{ ok: true; value: K } | { ok: false; error: Error }>[] = []
  const activePromises = new Set<Promise<any>>()
  const { shouldPause, shouldCancel } = options

  for (const item of array) {
    if (shouldCancel?.()) break

    if (shouldPause) {
      await shouldPause()
    }

    if (shouldCancel?.()) break

    const promise = Promise.resolve()
      .then(() => iteratorFn(item, array))
      .then<{ ok: true; value: K }>((value) => ({ ok: true, value }))
      .catch<{ ok: false; error: Error }>((error) => ({ ok: false, error }))

    results.push(promise)

    if (poolLimit < array.length) {
      activePromises.add(promise)
      const cleanup = () => activePromises.delete(promise)
      promise.then(cleanup, cleanup)

      if (activePromises.size >= poolLimit) {
        await Promise.race(activePromises)
      }
    }
  }

  return await Promise.all(results)
}

export const asyncPool = <T, K = any>(
  poolLimit: number,
  array: T[],
  iteratorFn: IteratorFn<T, K>,
) => {
  return runPool(poolLimit, array, iteratorFn)
}

export const createAsyncPool = <T, K>(
  poolLimit: number,
  array: T[],
  iteratorFn: IteratorFn<T, K>,
) => {
  let paused = false
  let cancelled = false
  let resumeResolve: (() => void) | null = null

  const controller: PoolController = {
    pause() {
      paused = true
    },
    resume() {
      paused = false
      resumeResolve?.()
      resumeResolve = null
    },
    cancel() {
      cancelled = true
      resumeResolve?.()
      resumeResolve = null
    },
  }

  const shouldPause = async () => {
    if (paused) {
      await new Promise<void>((resolve) => (resumeResolve = resolve))
    }
  }

  const shouldCancel = () => cancelled

  const run = () => runPool(poolLimit, array, iteratorFn, { shouldPause, shouldCancel })

  return { run, controller }
}

export const getUserAgent = () => {
  const appSettings = useAppSettingsStore()
  return appSettings.app.userAgent || APP_TITLE + '/' + APP_VERSION
}

export const getGitHubApiAuthorization = () => {
  const appSettings = useAppSettingsStore()
  return appSettings.app.githubApiToken ? `Bearer ${appSettings.app.githubApiToken}` : ''
}

// System ScheduledTask Helper
export const getTaskSchXmlString = async (delay = 30) => {
  const { appPath } = useEnvStore().env

  const xml = /*xml*/ `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>${APP_TITLE} at startup</Description>
    <URI>\\${APP_TITLE}</URI>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <Delay>PT${delay}S</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT72H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${appPath}</Command>
      <Arguments>tasksch</Arguments>
    </Exec>
  </Actions>
</Task>
`

  return xml
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
      String.fromCharCode(('0x' + p1) as any),
    ),
  )
}

export const base64Decode = (str: string) => {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
}

export const stringifyNoFolding = (content: any) => {
  // Disable string folding
  return stringify(content, { lineWidth: 0, minContentWidth: 0 })
}

const regexCache = new Map<string, RegExp>()

export const buildSmartRegExp = (pattern: string, flags = '') => {
  const key = pattern + '::' + flags
  if (regexCache.has(key)) return regexCache.get(key)!

  let r
  try {
    r = new RegExp(pattern, flags)
  } catch {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    r = new RegExp(escaped, flags)
  }

  regexCache.set(key, r)
  return r
}
