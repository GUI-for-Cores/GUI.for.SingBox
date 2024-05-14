import * as App from '@wails/go/bridge/App'
import { GetSystemProxy } from '@/utils/helper'
import { sampleID, getUserAgent } from '@/utils'
import { EventsOn, EventsOff } from '@wails/runtime/runtime'

type RequestOptions = {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'HEAD' | 'PATCH'
  url: string
  headers?: {
    'Content-Type'?: 'application/json' | 'application/x-www-form-urlencoded' | 'text/plain'
  } & Record<string, string>
  body?: any
  options?: {
    Proxy?: string
    Insecure?: boolean
    Timeout?: number
  }
}

type HttpResult = { status: number; headers: Record<string, string>; body: any }

const transformRequest = async (
  headers: RequestOptions['headers'],
  body: RequestOptions['body'],
  options: RequestOptions['options']
) => {
  headers = { 'User-Agent': getUserAgent(), ...headers }

  switch (headers['Content-Type']) {
    case 'application/json': {
      body && (body = JSON.stringify(body))
      break
    }
    case 'application/x-www-form-urlencoded': {
      body && (body = new URLSearchParams(body).toString())
      break
    }
  }

  options = {
    Proxy: await GetSystemProxy(),
    Insecure: false,
    Timeout: 15,
    ...options
  }
  return [headers, body, options]
}

const transformResponse = <T = any>(
  status: number,
  headers: Record<string, string[]>,
  body: string
) => {
  Object.entries(headers).forEach(([key, value]) => (headers[key] = value[0] as any))

  if (headers['Content-Type']?.includes('application/json')) {
    body = JSON.parse(body)
  }

  return { status, headers: headers as unknown as HttpResult['headers'], body: body as T }
}

type RequestWithProgressOptions = {
  url: string
  path: string
  headers: RequestOptions['headers']
  options: RequestOptions['options']
  progress: (progress: number, total: number) => void
}

const requestWithProgress = async (reqType: number, reqOptions: RequestWithProgressOptions) => {
  const { url, path, headers = {}, progress = () => 0, options = {} } = reqOptions

  const [_headers, , _options] = await transformRequest(headers, null, {
    Timeout: 20 * 60,
    ...options
  })

  const event = sampleID()

  EventsOn(event, progress)

  const {
    flag,
    status,
    headers: __headers,
    body
  } = await App[reqType === 0 ? 'Download' : 'Upload'](url, path, _headers, event, _options)

  EventsOff(event)

  if (!flag) throw body

  return transformResponse(status, __headers, body)
}

export const Download = async (
  url: string,
  path: string,
  headers: RequestOptions['headers'] = {},
  progress: RequestWithProgressOptions['progress'] = () => 0,
  options: RequestOptions['options'] = {}
) => {
  return await requestWithProgress(0, { url, path, headers, progress, options })
}

export const Upload = async (
  url: string,
  path: string,
  headers: RequestOptions['headers'] = {},
  progress: RequestWithProgressOptions['progress'] = () => 0,
  options: RequestOptions['options'] = {}
) => {
  return await requestWithProgress(1, { url, path, headers, progress, options })
}

export const HttpGet = async <T = any>(
  url: string,
  headers: RequestOptions['headers'] = {},
  options = {}
) => {
  const [_headers, , _options] = await transformRequest(headers, null, options)

  const { flag, status, headers: __headers, body } = await App.HttpGet(url, _headers, _options)

  if (!flag) throw body

  return transformResponse<T>(status, __headers, body)
}

export const HttpPost = async <T = any>(
  url: string,
  headers: RequestOptions['headers'] = {},
  body = {},
  options = {}
) => {
  const [_headers, _body, _options] = await transformRequest(headers, body, options)

  const {
    flag,
    status,
    headers: __headers,
    body: __body
  } = await App.HttpPost(url, _headers, _body, _options)

  if (!flag) throw __body

  return transformResponse<T>(status, __headers, __body)
}

export const HttpDelete = async <T = any>(
  url: string,
  headers: RequestOptions['headers'] = {},
  options = {}
) => {
  const [_headers, , _options] = await transformRequest(headers, null, options)

  const {
    flag,
    status,
    headers: __headers,
    body: _body
  } = await App.HttpDelete(url, _headers, _options)

  if (!flag) throw _body

  return transformResponse<T>(status, __headers, _body)
}

export const HttpPut = async <T = any>(
  url: string,
  headers: RequestOptions['headers'] = {},
  body = {},
  options = {}
) => {
  const [_headers, _body, _options] = await transformRequest(headers, body, options)

  const {
    flag,
    status,
    headers: __headers,
    body: __body
  } = await App.HttpPut(url, _headers, _body, _options)

  if (!flag) throw _body

  return transformResponse<T>(status, __headers, __body)
}

export const Requests = async (options: RequestOptions) => {
  const { method = 'GET', url, headers = {}, body = '', options: _options = {} } = options
  const {
    flag,
    status,
    headers: _headers,
    body: _body
  } = await App.Requests(method.toUpperCase(), url, headers, body, _options)

  if (!flag) throw _body

  return {
    status,
    headers: Object.entries(_headers).reduce((p, c: any) => ({ ...p, [c[0]]: c[1][0] }), {}),
    body: _body
  }
}
