import { stringify } from 'yaml'

import { useAppSettingsStore, useEnvStore } from '@/stores'
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
  } catch {
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

// System ScheduledTask Helper
export const getTaskSchXmlString = async (delay = 30) => {
  const { basePath, appName } = useEnvStore().env

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
      <Command>${basePath}\\${appName}</Command>
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
