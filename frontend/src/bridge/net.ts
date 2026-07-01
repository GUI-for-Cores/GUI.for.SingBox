import * as Bridge from '@wails/go/bridge/App'
import { EventsOn, EventsOff, EventsEmit } from '@wails/runtime/runtime'

import { RequestMethod } from '@/enums/app'
import { sampleID, transformRequestUrl, getUserAgent } from '@/utils'
import { GetRequestProxy } from '@/utils/helper'

interface NetOptions {
  Mode?: 'Binary' | 'Text'
  Timeout?: number
}

type StreamEvent =
  | {
      type: 'response'
      status: number
      headers: Record<string, string | string[]>
    }
  | {
      type: 'message'
      event: string
      data: string
      id?: string
      retry?: number
    }
  | {
      type: 'done'
    }
  | {
      type: 'error'
      error: string
    }

interface Request {
  method: App.RequestMethod
  url: string
  headers?: {
    'Content-Type'?: 'application/json' | 'application/x-www-form-urlencoded' | 'text/plain'
  } & Record<string, string>
  body?: any
  options?: {
    Proxy?: string
    Insecure?: boolean
    Redirect?: boolean
    Timeout?: number
    CancelId?: string
    FileField?: string
    Sha256?: string
    Stream?: string
  }
}

interface Response<T = any> {
  status: number
  headers: Record<string, string | string[]>
  body: T
}

const mergeNetOptions = (options: NetOptions = {}): Required<NetOptions> => ({
  Mode: 'Text',
  Timeout: 15, // 15 seconds
  ...options,
})

const mergeRequestOptions = async (options: Request['options']) => {
  const mergedReqOpts: Required<Request['options']> = {
    Proxy: options?.Proxy ?? (await GetRequestProxy()),
    Insecure: false,
    Redirect: true,
    Timeout: 15, // 15 seconds
    CancelId: '',
    FileField: 'file',
    Sha256: '',
    Stream: '',
    ...options,
  }
  return mergedReqOpts
}

const transformResponseHeaders = (
  headers: Record<string, string | string[]>,
): Response['headers'] => {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, value.length > 1 ? value : value[0]!]),
  )
}

const transformResponseBody = <T>(body: Response['body'], headers: Response['headers']) => {
  if (headers['Content-Type']?.includes('application/json')) {
    try {
      body = JSON.parse(body)
    } catch {
      console.warn('Failed to parse response body as JSON:', body)
    }
  }
  return body as T
}

const transformRequest = async (
  headers: Request['headers'],
  body: Request['body'],
  options: Request['options'],
) => {
  const transformedHeaders = { 'User-Agent': getUserAgent(), ...headers }

  if (transformedHeaders['Content-Type']?.includes('application/json')) {
    body && (body = JSON.stringify(body))
  } else if (transformedHeaders['Content-Type']?.includes('application/x-www-form-urlencoded')) {
    body && (body = new URLSearchParams(body).toString())
  }

  const transformedReqOpts = await mergeRequestOptions(options)
  return [transformedHeaders, body, transformedReqOpts] as const
}

const transformResponse = <T = any>(
  status: Response['status'],
  headers: Record<string, string[]>,
  body: Response['body'],
) => {
  const transformedHeaders = transformResponseHeaders(headers)
  const transformedBody = transformResponseBody<T>(body, transformedHeaders)

  return { status, headers: transformedHeaders, body: transformedBody }
}

interface RequestWithProgressOptions {
  Method?: Request['method']
}

const requestWithProgress = (fnName: 'Download' | 'Upload') => {
  return async (
    url: Request['url'],
    path: string,
    headers: Request['headers'] = {},
    progress?: (progress: number, total: number) => void,
    options: Request['options'] & RequestWithProgressOptions = {},
  ) => {
    const [_headers, , _options] = await transformRequest(headers, null, {
      Timeout: 20 * 60, // 20 minutes
      ...options,
    })

    const method =
      options.Method ?? { Download: RequestMethod.Get, Upload: RequestMethod.Post }[fnName]

    const progressEvent = (progress && sampleID()) || ''

    if (progressEvent) {
      EventsOn(progressEvent, progress!)
    }

    const {
      flag,
      status,
      headers: respHeaders,
      body: respBody,
    } = await Bridge[fnName](
      method,
      transformRequestUrl(url),
      path,
      _headers,
      progressEvent,
      _options,
    )

    if (progressEvent) {
      EventsOff(progressEvent)
    }

    if (!flag) throw respBody

    return transformResponse(status, respHeaders, respBody)
  }
}

const requestWithBody = (method: Extract<App.RequestMethod, 'PUT' | 'POST' | 'PATCH'>) => {
  return async <T = any>(
    url: string,
    headers: Request['headers'] = {},
    body = {},
    options = {},
  ) => {
    const [_headers, _body, _options] = await transformRequest(headers, body, options)

    const {
      flag,
      status,
      headers: respHeaders,
      body: respBody,
    } = await Bridge.Requests(method, transformRequestUrl(url), _headers, _body, _options)

    if (!flag) throw respBody

    return transformResponse<T>(status, respHeaders, respBody)
  }
}

const requestWithoutBody = (methd: Extract<App.RequestMethod, 'GET' | 'HEAD' | 'DELETE'>) => {
  return async <T = any>(
    url: string,
    headers: Request['headers'] = {},
    options: Request['options'] = {},
  ) => {
    const [_headers, , _options] = await transformRequest(headers, null, options)

    const {
      flag,
      status,
      headers: respHeaders,
      body,
    } = await Bridge.Requests(methd, transformRequestUrl(url), _headers, '', _options)

    if (!flag) throw body

    return transformResponse<T>(status, respHeaders, body)
  }
}

interface RequestWithAutoTransform extends Request {
  autoTransformBody?: boolean
  onStream?: (e: StreamEvent) => void
}

export const Requests = async <T = any>(options: RequestWithAutoTransform) => {
  const { method = 'GET', url, headers = {}, body = '', options: reqOpts = {} } = options

  const [reqHeaders, reqBody, finalReqOpts] = await transformRequest(headers, body, reqOpts)
  const streamEvent = (options.onStream && sampleID()) || ''
  finalReqOpts.Stream = streamEvent

  if (streamEvent) {
    EventsOn(streamEvent, (e: StreamEvent) => {
      if (e.type == 'response') {
        e.headers = transformResponseHeaders(e.headers)
      } else if (e.type == 'error' || e.type == 'done') {
        EventsOff(streamEvent)
      }
      options.onStream!(e)
    })
  }

  const {
    flag,
    status,
    headers: respHeaders,
    body: respBody,
  } = await Bridge.Requests(
    method.toUpperCase(),
    transformRequestUrl(url),
    reqHeaders,
    reqBody,
    finalReqOpts,
  )

  if (!flag) throw respBody

  const transformedHeaders = transformResponseHeaders(respHeaders)
  const transformBody = options.autoTransformBody ?? true

  return {
    status,
    headers: transformedHeaders,
    body: transformBody ? transformResponseBody<T>(respBody, transformedHeaders) : (respBody as T),
  }
}

export const Upload = requestWithProgress('Upload')
export const Download = requestWithProgress('Download')

export const HttpGet = requestWithoutBody(RequestMethod.Get)
export const HttpHead = requestWithoutBody(RequestMethod.Head)
export const HttpDelete = requestWithoutBody(RequestMethod.Delete)

export const HttpPut = requestWithBody(RequestMethod.Put)
export const HttpPost = requestWithBody(RequestMethod.Post)
export const HttpPatch = requestWithBody(RequestMethod.Patch)

export const HttpCancel = (cancelId: string) => EventsEmit(cancelId)

export const TcpPing = async (address: string, options: NetOptions = {}) => {
  const { flag, data } = await Bridge.TcpPing(address, mergeNetOptions(options))
  if (!flag) throw data
  return Number(data)
}

export const TcpRequest = async (address: string, payload: string, options: NetOptions = {}) => {
  const { flag, data } = await Bridge.TcpRequest(address, payload, mergeNetOptions(options))
  if (!flag) throw data
  return data
}

export const UdpRequest = async (address: string, payload: string, options: NetOptions = {}) => {
  const { flag, data } = await Bridge.UdpRequest(address, payload, mergeNetOptions(options))
  if (!flag) throw data
  return data
}
