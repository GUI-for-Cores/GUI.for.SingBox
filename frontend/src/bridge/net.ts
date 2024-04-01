import { sampleID, getUserAgent } from '@/utils'
import * as App from '@wails/go/bridge/App'
import { GetSystemProxy } from '@/utils/helper'
import { EventsOn, EventsOff } from '@wails/runtime/runtime'

type RequestProgressCallback = (progress: number, total: number) => void

type HttpHeader = {
  'Content-Type'?: 'application/json' | 'application/x-www-form-urlencoded' | 'text/plain'
} & Record<string, string>

type HttpResult = { header: Record<string, string>; body: any }

const transformRequest = (header: Record<string, string>, body: any) => {
  header = { 'User-Agent': getUserAgent(), ...header }

  switch (header['Content-Type']) {
    case 'application/json': {
      body = JSON.stringify(body)
      break
    }
    case 'application/x-www-form-urlencoded': {
      const usp = new URLSearchParams()
      Object.entries(body).forEach(([key, value]: any) => usp.append(key, value))
      body = usp.toString()
      break
    }
  }
  return { header, body }
}

const transformResponse = <T = any>(header: Record<string, string[]>, body: string) => {
  const _header: HttpResult['header'] = {}
  let _body = body as T

  Object.entries(header).forEach(([key, value]) => (_header[key] = value[0]))

  if (_header['Content-Type']?.includes('application/json')) {
    _body = JSON.parse(body)
  }

  return { header: _header, body: _body }
}

export const Download = async (
  url: string,
  path: string,
  headers: HttpHeader = {},
  progress?: RequestProgressCallback
) => {
  const proxy = await GetSystemProxy()
  const { header: _header } = transformRequest(headers, null)

  const event = progress ? sampleID() : ''

  progress && EventsOn(event, progress)

  const { flag, header, body } = await App.Download(url, path, _header, event, proxy)

  progress && EventsOff(event)

  if (!flag) throw body

  return transformResponse(header, body)
}

export const Upload = async (
  url: string,
  path: string,
  headers: HttpHeader = {},
  progress?: RequestProgressCallback
) => {
  const proxy = await GetSystemProxy()
  const { header: _header } = transformRequest(headers, null)

  const event = progress ? sampleID() : ''

  progress && EventsOn(event, progress)

  const { flag, header, body } = await App.Upload(url, path, _header, event, proxy)

  progress && EventsOff(event)

  if (!flag) throw body

  return transformResponse(header, body)
}

export const HttpGet = async <T = any>(url: string, headers: HttpHeader = {}) => {
  const proxy = await GetSystemProxy()
  const { header: _header } = transformRequest(headers, null)

  const { flag, header, body } = await App.HttpGet(url, _header, proxy)
  if (!flag) {
    throw body
  }

  return transformResponse<T>(header, body)
}

export const HttpPost = async <T = any>(url: string, headers: HttpHeader = {}, body = {}) => {
  const proxy = await GetSystemProxy()
  const { header: _header, body: bodyStr } = transformRequest(headers, body)

  const { flag, header, body: _body } = await App.HttpPost(url, _header, bodyStr, proxy)
  if (!flag) {
    throw _body
  }

  return transformResponse<T>(header, _body)
}

export const HttpDelete = async <T = any>(url: string, headers: HttpHeader = {}) => {
  const proxy = await GetSystemProxy()
  const { header: _header } = transformRequest(headers, null)

  const { flag, header, body: _body } = await App.HttpDelete(url, _header, proxy)
  if (!flag) {
    throw _body
  }

  return transformResponse<T>(header, _body)
}

export const HttpPut = async <T = any>(url: string, headers: HttpHeader = {}, body = {}) => {
  const proxy = await GetSystemProxy()
  const { header: _header, body: bodyStr } = transformRequest(headers, body)

  const { flag, header, body: _body } = await App.HttpPut(url, _header, bodyStr, proxy)
  if (!flag) {
    throw _body
  }

  return transformResponse<T>(header, _body)
}
