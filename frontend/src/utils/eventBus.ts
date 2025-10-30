type EventMap = {
  profileChange: { id: string }
  subscriptionChange: { id: string }
  subscriptionsChange: void
  rulesetChange: { id: string }
  rulesetsChange: void
}

class TypedEventBus<Events extends Record<string, any>> {
  private handlers: {
    [K in keyof Events]?: ((data: Events[K]) => void)[]
  } = {}

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const list = this.handlers[event] || []
    list.push(handler)
    this.handlers[event] = list
  }

  off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const list = this.handlers[event]
    if (!list) return
    this.handlers[event] = list.filter((h) => h !== handler)
  }

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    const list = this.handlers[event]
    if (!list) return
    list.forEach((h) => h(data))
  }
}

export const eventBus = new TypedEventBus<EventMap>()
