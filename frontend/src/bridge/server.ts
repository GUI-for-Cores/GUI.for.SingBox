import * as App from '@wails/go/bridge/App'
import { EventsOn, EventsEmit, EventsOff } from '@wails/runtime/runtime'

type RequestType = {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
}
type ResponseType = { end: (status: number, headers: Record<string, string>, body: string) => void }
type HttpServerHandler = (req: RequestType, res: ResponseType) => void

export const StartServer = async (address: string, id: string, handler: HttpServerHandler) => {
  const { flag, data } = await App.StartServer(address, id)
  if (!flag) {
    throw data
  }

  EventsOn(id, (...args) => {
    const [id, method, url, headers, body] = args
    handler(
      {
        id,
        method,
        url,
        headers: Object.entries(headers).reduce((p, c: any) => ({ ...p, [c[0]]: c[1][0] }), {}),
        body
      },
      {
        end: (status, headers, body) => {
          EventsEmit(id, status, JSON.stringify(headers), body)
        }
      }
    )
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
