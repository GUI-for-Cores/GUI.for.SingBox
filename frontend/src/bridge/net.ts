import { sampleID } from '@/utils'
import * as App from '@wails/go/bridge/App'
import { GetSystemProxy } from '@/utils/helper'
import { EventsOn, EventsOff } from '@wails/runtime/runtime'

type DownloadProgressCallback = (progress: number, total: number) => void

export const Download = async (url: string, path: string, progress?: DownloadProgressCallback) => {
  const proxy = await GetSystemProxy()
  const event = progress ? sampleID() : ''
  if (event && progress) EventsOn(event, progress)
  const { flag, data } = await App.Download(url, path, event, proxy)
  if (event) EventsOff(event)
  if (!flag) {
    throw data
  }
  return data
}

export const HttpGet = async (url: string, headers = {}) => {
  const proxy = await GetSystemProxy()
  const { flag, header, body } = await App.HttpGet(url, headers, proxy)
  if (!flag) {
    throw body
  }
  return { header, body }
}

export const HttpGetJSON = async (url: string, headers = {}) => {
  const proxy = await GetSystemProxy()
  const { flag, header, body } = await App.HttpGet(url, headers, proxy)
  if (!flag) {
    throw body
  }
  try {
    const json = JSON.parse(body)
    return { header, json }
  } catch {
    throw 'Wrong data format: ' + body
  }
}

export const HttpPost = async (url: string, headers = {}, body = {}) => {
  const proxy = await GetSystemProxy()
  const {
    flag,
    header,
    body: _body
  } = await App.HttpPost(url, headers, JSON.stringify(body), proxy)
  if (!flag) {
    throw _body
  }
  if ((header['Content-Type'] || header['content-type'])?.[0]?.includes('application/json')) {
    return { header, body: JSON.parse(_body) }
  }
  return { header, body: _body }
}
