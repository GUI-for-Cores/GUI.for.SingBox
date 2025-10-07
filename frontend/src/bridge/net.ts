import * as App from '@wails/go/bridge/App'
import { EventsOn, EventsOff, EventsEmit } from '@wails/runtime/runtime'

import { RequestMethod } from '@/enums/app'
import { sampleID, getUserAgent } from '@/utils'
import { GetSystemOrKernelProxy } from '@/utils/helper'

interface Request {
  method: RequestMethod
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
  }
}

interface Response<T = any> {
  status: number
  headers: Record<string, string | string[]>
  body: T
}

const mergeRequestOptions = async (options: Request['options']) => {
  const mergedReqOpts: Required<Request['options']> = {
    Proxy: await GetSystemOrKernelProxy(),
    Insecure: false,
    Redirect: true,
    Timeout: 15, // 15 seconds
    CancelId: '',
    FileField: 'file',
    ...options,
  }
  return mergedReqOpts
}

const transformResponseHeaders = (headers: Record<string, string[]>): Response['headers'] => {
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
    } = await App[fnName](method, url, path, _headers, progressEvent, _options)

    if (progressEvent) {
      EventsOff(progressEvent)
    }

    if (!flag) throw respBody

    return transformResponse(status, respHeaders, respBody)
  }
}

const requestWithBody = (method: RequestMethod.Put | RequestMethod.Post | RequestMethod.Patch) => {
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
    } = await App.Requests(method, url, _headers, _body, _options)

    if (!flag) throw respBody

    return transformResponse<T>(status, respHeaders, respBody)
  }
}

const requestWithoutBody = (
  methd: RequestMethod.Get | RequestMethod.Head | RequestMethod.Delete,
) => {
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
    } = await App.Requests(methd, url, _headers, '', _options)

    if (!flag) throw body

    return transformResponse<T>(status, respHeaders, body)
  }
}

interface RequestWithAutoTransform extends Request {
  autoTransformBody?: boolean
}

export const Requests = async <T = any>(options: RequestWithAutoTransform) => {
  const { method = 'GET', url, headers = {}, body = '', options: reqOpts = {} } = options

  const [reqHeaders, reqBody, finalReqOpts] = await transformRequest(headers, body, reqOpts)

  const {
    flag,
    status,
    headers: respHeaders,
    body: respBody,
  } = await App.Requests(method.toUpperCase(), url, reqHeaders, reqBody, finalReqOpts)

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
