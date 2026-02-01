type WebSocketsOptions = {
  base?: string
  bearer?: string
  beforeConnect?: () => void
}

type URLType = { name: string; url: string; cb: (data: any) => void; params?: Record<string, any> }

export class WebSockets {
  public base: string
  public bearer: string
  public beforeConnect: () => void

  constructor(options: WebSocketsOptions) {
    this.base = options.base || ''
    this.bearer = options.bearer || ''
    this.beforeConnect = options.beforeConnect || (() => 0)
  }

  public createWS(urls: URLType[]) {
    this.beforeConnect()

    const wsMap: Recordable<{ close: () => void; open: () => void; isManualClose: boolean }> = {}

    urls.forEach(({ name, url, params = {}, cb }) => {
      Object.assign(params, { token: this.bearer })

      const query = new URLSearchParams(params).toString()

      query && (url += '?' + query)

      let ws: WebSocket | null = null

      const open = () => {
        ws = new WebSocket(this.base + url)
        ws.onmessage = (e) => cb(JSON.parse(e.data))
        ws.onclose = () => {
          setTimeout(() => {
            if (!wsMap[name]!.isManualClose) {
              setTimeout(open, 3000)
            }
          }, 1000)
        }
      }

      const close = () => {
        wsMap[name]!.isManualClose = true
        ws?.close()
        ws = null
      }

      wsMap[name] = { open, close, isManualClose: false }
    })

    return {
      connect: () => Object.values(wsMap).forEach((ws) => ws.open()),
      disconnect: () => Object.values(wsMap).forEach((ws) => ws.close()),
    }
  }
}
