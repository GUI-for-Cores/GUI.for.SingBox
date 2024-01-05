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

  public connect(urls: URLType[]) {
    this.beforeConnect()
    const wsMap: Record<string, WebSocket> = {}
    urls.forEach(({ name, url, params = {}, cb }) => {
      try {
        const usp = new URLSearchParams()
        Object.assign(params, { token: this.bearer })
        Object.entries(params).forEach(([key, value]) => {
          usp.set(key, value)
        })
        const query = usp.toString()
        if (query) {
          url += '?' + query
        }
        const ws = new WebSocket(this.base + url)
        ws.onmessage = (e) => cb(JSON.parse(e.data))
        ws.onerror = () => delete wsMap[name]
        ws.onclose = () => delete wsMap[name]
        wsMap[name] = ws
      } catch (e: any) {
        console.log(e)
      }
    })

    return () => Object.values(wsMap).forEach((ws) => ws.close())
  }
}
