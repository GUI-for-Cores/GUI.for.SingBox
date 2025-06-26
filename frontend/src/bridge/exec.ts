import * as App from '@wails/go/bridge/App'
import { EventsOn, EventsOff } from '@wails/runtime/runtime'

import { sampleID } from '@/utils'

interface ExecOptions {
  convert?: boolean
  env?: Record<string, any>
  stopOutputKeyword?: string
}

const mergeExecOptions = (options: ExecOptions) => {
  const mergedExecOpts = { convert: false, env: {}, stopOutputKeyword: '', ...options }
  return mergedExecOpts
}

export const Exec = async (path: string, args: string[], options: ExecOptions = {}) => {
  const { flag, data } = await App.Exec(path, args, mergeExecOptions(options))
  if (!flag) {
    throw data
  }
  return data
}

export const ExecBackground = async (
  path: string,
  args: string[] = [],
  onOut?: (out: string) => void,
  onEnd?: () => void,
  options: ExecOptions = {},
) => {
  const outEvent = (onOut && sampleID()) || ''
  const endEvent = (onEnd && sampleID()) || (outEvent && sampleID()) || ''

  const { flag, data } = await App.ExecBackground(
    path,
    args,
    outEvent,
    endEvent,
    mergeExecOptions(options),
  )
  if (!flag) {
    throw data
  }

  if (outEvent) {
    EventsOn(outEvent, onOut!)
  }

  if (endEvent) {
    EventsOn(endEvent, () => {
      outEvent && EventsOff(outEvent)
      EventsOff(endEvent)
      onEnd?.()
    })
  }

  return Number(data)
}

export const ProcessInfo = async (pid: number) => {
  const { flag, data } = await App.ProcessInfo(pid)
  if (!flag) {
    throw data
  }
  return data
}

export const KillProcess = async (pid: number, timeout = 10) => {
  const { flag, data } = await App.KillProcess(pid, timeout)
  if (!flag) {
    throw data
  }
  return data
}
