import * as App from '@wails/go/bridge/App'
import { GetSystemOrKernelProxy } from '@/utils/helper'
import { sampleID, getUserAgent } from '@/utils'
import { EventsOn, EventsOff, EventsEmit } from '@wails/runtime/runtime'

type RequestType = {
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
    CancelId?: string
    FileField?: string
  }
}

type ResponseType = { status: number; headers: Record<string, string>; body: any }

const transformRequest = async (
  headers: RequestType['headers'],
  body: RequestType['body'],
  options: RequestType['options'],
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
    Proxy: await GetSystemOrKernelProxy(),
    Insecure: false,
    Timeout: 15,
    CancelId: '',
    ...options,
  }
  return [headers, body, options]
}

const transformResponse = <T = any>(
  status: ResponseType['status'],
  headers: Record<string, string[]>,
  body: ResponseType['body'],
) => {
  Object.entries(headers).forEach(
    ([key, value]) => (headers[key] = (value.length > 1 ? value : value[0]) as any),
  )

  if (headers['Content-Type']?.includes('application/json')) {
    body = JSON.parse(body)
  }

  return { status, headers: headers as unknown as ResponseType['headers'], body: body as T }
}

const requestWithProgress = (method: 'Download' | 'Upload') => {
  return async (
    url: RequestType['url'],
    path: string,
    headers: RequestType['headers'] = {},
    progress: (progress: number, total: number) => void = () => 0,
    options: RequestType['options'] = {},
  ) => {
    const [_headers, , _options] = await transformRequest(headers, null, {
      Timeout: 20 * 60,
      ...options,
    })

    const event = sampleID()

    EventsOn(event, progress)

    const {
      flag,
      status,
      headers: __headers,
      body,
    } = await App[method](url, path, _headers, event, _options)

    EventsOff(event)

    if (!flag) throw body

    return transformResponse(status, __headers, body)
  }
}

const requestWithBody = (method: 'PUT' | 'POST' | 'PATCH') => {
  return async <T = any>(
    url: string,
    headers: RequestType['headers'] = {},
    body = {},
    options = {},
  ) => {
    const [_headers, _body, _options] = await transformRequest(headers, body, options)

    const {
      flag,
      status,
      headers: __headers,
      body: __body,
    } = await App.Requests(method, url, _headers, _body, _options)

    if (!flag) throw __body

    return transformResponse<T>(status, __headers, __body)
  }
}

const requestWithoutBody = (methd: 'GET' | 'HEAD' | 'DELETE') => {
  return async <T = any>(url: string, headers: RequestType['headers'] = {}, options = {}) => {
    const [_headers, , _options] = await transformRequest(headers, null, options)

    const {
      flag,
      status,
      headers: __headers,
      body,
    } = await App.Requests(methd, url, _headers, '', _options)

    if (!flag) throw body

    return transformResponse<T>(status, __headers, body)
  }
}

export const Requests = async (options: RequestType) => {
  const { method = 'GET', url, headers = {}, body = '', options: _options = {} } = options

  const __options: Required<RequestType['options']> = {
    Proxy: await GetSystemOrKernelProxy(),
    Insecure: false,
    Timeout: 15,
    CancelId: '',
    FileField: 'file',
    ..._options,
  }

  const {
    flag,
    status,
    headers: _headers,
    body: _body,
  } = await App.Requests(method.toUpperCase(), url, headers, body, __options)

  if (!flag) throw _body

  return {
    status,
    headers: Object.entries(_headers).reduce(
      (p, c) => ({ ...p, [c[0]]: c[1].length > 1 ? c[1] : c[1][0] }),
      {},
    ),
    body: _body,
  }
}

export const Upload = requestWithProgress('Upload')
export const Download = requestWithProgress('Download')

export const HttpGet = requestWithoutBody('GET')
export const HttpHead = requestWithoutBody('HEAD')
export const HttpDelete = requestWithoutBody('DELETE')

export const HttpPut = requestWithBody('PUT')
export const HttpPost = requestWithBody('POST')
export const HttpPatch = requestWithBody('PATCH')

export const HttpCancel = (cancelId: string) => EventsEmit(cancelId)
