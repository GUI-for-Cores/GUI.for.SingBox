import * as App from '@wails/go/bridge/App'
import { EventsOn, EventsEmit, EventsOff } from '@wails/runtime/runtime'

type RequestType = {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
}

type ResponseType = {
  status: number
  headers: Record<string, string>
  body: string
  options: { mode: 'Binary' | 'Text' }
}

type ServerOptions = {
  Cert?: string
  Key?: string
  StaticPath?: string
  StaticRoute?: string
  UploadPath?: string
  UploadRoute?: string
  MaxUploadSize?: number
}

type HttpServerHandler = (
  req: RequestType,
  res: {
    end: (
      status: ResponseType['status'],
      headers: ResponseType['headers'],
      body: ResponseType['body'],
      options: ResponseType['options'],
    ) => void
  },
) => Promise<void>

export const StartServer = async (
  address: string,
  id: string,
  handler: HttpServerHandler,
  options: ServerOptions = {},
) => {
  const _options: Required<ServerOptions> = {
    Cert: '',
    Key: '',
    StaticPath: '', // default: /static
    StaticRoute: '/static/',
    UploadPath: '', // default: /upload
    UploadRoute: '/upload',
    MaxUploadSize: 50 * 1024 * 1024, // 50MB
    ...options,
  }
  const { flag, data } = await App.StartServer(address, id, _options)
  if (!flag) {
    throw data
  }

  EventsOn(id, async (...args) => {
    const [id, method, url, headers, body] = args
    try {
      await handler(
        {
          id,
          method,
          url,
          headers: Object.entries(headers).reduce((p, c: any) => ({ ...p, [c[0]]: c[1][0] }), {}),
          body,
        },
        {
          end: (status, headers, body, options = { mode: 'Text' }) => {
            EventsEmit(id, status, JSON.stringify(headers), body, JSON.stringify(options))
          },
        },
      )
    } catch (err: any) {
      console.log('Server handler err:', err, id)
      EventsEmit(
        id,
        500,
        JSON.stringify({ 'Content-Type': 'text/plain; charset=utf-8' }),
        err.message || err,
        JSON.stringify({ Mode: 'Text' }),
      )
    }
  })
  return { close: () => StopServer(id) }
}

export const StopServer = async (serverID: string) => {
  const { flag, data } = await App.StopServer(serverID)
  if (!flag) {
    throw data
  }
  EventsOff(serverID)
  return data
}

export const ListServer = async () => {
  const { flag, data } = await App.ListServer()
  if (!flag) {
    throw data
  }
  return data.split('|').filter((id) => id.length)
}
