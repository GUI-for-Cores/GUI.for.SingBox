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

    const wsMap: Record<string, { ready: boolean; close: () => void; open: () => void }> = {}

    urls.forEach(({ name, url, params = {}, cb }) => {
      Object.assign(params, { token: this.bearer })

      const query = new URLSearchParams(params).toString()

      query && (url += '?' + query)

      const open = () => {
        if (!wsMap[name].ready) return
        const ws = new WebSocket(this.base + url)
        ws.onmessage = (e) => cb(JSON.parse(e.data))
        ws.onerror = () => (wsMap[name].ready = true)
        ws.onclose = () => (wsMap[name].ready = true)
        wsMap[name].close = () => {
          ws.close()
          wsMap[name].ready = true
        }
        wsMap[name].ready = false
      }

      wsMap[name] = { ready: true, open, close: () => (wsMap[name].ready = false) }
    })

    return {
      connect: () => Object.values(wsMap).forEach((ws) => ws.open()),
      disconnect: () => Object.values(wsMap).forEach((ws) => ws.close())
    }
  }
}
