import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parse } from 'yaml'

import { ReadFile, WriteFile, Requests } from '@/bridge'
import { DefaultSubscribeScript, SubscribesFilePath } from '@/constant/app'
import { DefaultExcludeProtocols } from '@/constant/kernel'
import { PluginTriggerEvent, RequestMethod, RequestProxyMode } from '@/enums/app'
import { usePluginsStore } from '@/stores'
import {
  sampleID,
  isValidSubJson,
  isValidSubYAML,
  isValidBase64,
  stringifyNoFolding,
  ignoredError,
  omitArray,
  asyncPool,
  eventBus,
  buildSmartRegExp,
  GetRequestProxy,
  migrateSubscribes,
} from '@/utils'

const collectDomainResolverTags = (value: any): string[] => {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap(collectDomainResolverTags)

  return Object.entries(value).flatMap(([key, val]) => {
    if (key === 'domain_resolver' && typeof val === 'string' && val) {
      return [val]
    }
    return collectDomainResolverTags(val)
  })
}

const collectReferencedDnsServers = (
  outbounds: Recordable[],
  dnsServers: Recordable[],
): Recordable[] => {
  const serverMap = new Map<string, Recordable>(
    dnsServers.flatMap((server) => (server.tag ? [[server.tag, server]] : [])),
  )
  const result = new Map<string, Recordable>()
  const pending = outbounds.flatMap(collectDomainResolverTags)

  while (pending.length > 0) {
    const tag = pending.shift()!
    if (result.has(tag)) continue

    const server = serverMap.get(tag)
    if (!server) continue

    result.set(tag, server)
    pending.push(...collectDomainResolverTags(server))
  }

  return Array.from(result.values())
}

export const useSubscribesStore = defineStore('subscribes', () => {
  const subscribes = ref<App.Subscription[]>([])

  const setupSubscribes = async () => {
    const data = await ignoredError(ReadFile, SubscribesFilePath)
    data && (subscribes.value = parse(data))

    await migrateSubscribes(subscribes.value, saveSubscribes)
  }

  const saveSubscribes = () => {
    const s = omitArray(subscribes.value, ['updating'])
    return WriteFile(SubscribesFilePath, stringifyNoFolding(s))
  }

  const addSubscribe = async (s: App.Subscription) => {
    subscribes.value.push(s)
    try {
      await saveSubscribes()
    } catch (error) {
      const idx = subscribes.value.indexOf(s)
      if (idx !== -1) {
        subscribes.value.splice(idx, 1)
      }
      throw error
    }
  }

  const importSubscribe = async (name: string, url: string) => {
    await addSubscribe(getSubscribeTemplate(name, { url }))
  }

  const deleteSubscribe = async (id: string) => {
    const idx = subscribes.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = subscribes.value.splice(idx, 1)[0]!
    try {
      await saveSubscribes()
    } catch (error) {
      subscribes.value.splice(idx, 0, backup)
      throw error
    }

    eventBus.emit('subscriptionChange', { id })
  }

  const editSubscribe = async (id: string, s: App.Subscription) => {
    const idx = subscribes.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = subscribes.value.splice(idx, 1, s)[0]!
    try {
      await saveSubscribes()
    } catch (error) {
      subscribes.value.splice(idx, 1, backup)
      throw error
    }

    eventBus.emit('subscriptionChange', { id })
  }

  const _doUpdateSub = async (s: App.Subscription, options: Partial<App.Subscription> = {}) => {
    const userInfo: Recordable = {}
    let body = ''
    let proxies: Record<string, any>[] = []
    let dnsServers: Recordable[] = []

    if (s.type === 'Manual') {
      body = await ReadFile(s.path)
    }

    if (s.type === 'File') {
      body = await ReadFile(s.url)
    }

    if (s.type === 'Http') {
      const requestProxyMode = options.requestProxyMode ?? s.requestProxyMode
      const { headers: h, body: b } = await Requests({
        method: options.requestMethod ?? s.requestMethod,
        url: options.url ?? s.url,
        headers: { ...s.header.request, ...options.header?.request },
        autoTransformBody: false,
        options: {
          Insecure: options.inSecure ?? s.inSecure,
          Proxy: await GetRequestProxy(
            requestProxyMode === RequestProxyMode.Global ? undefined : requestProxyMode,
            requestProxyMode === RequestProxyMode.Global
              ? undefined
              : (options.customProxy ?? s.customProxy),
          ),
          Timeout: options.requestTimeout ?? s.requestTimeout,
        },
      })
      Object.assign(h, s.header.response, options.header?.response)
      if (h['Subscription-Userinfo']) {
        ;(h['Subscription-Userinfo'] as string).split(/\s*;\s*/).forEach((part) => {
          const [key, value] = part.split('=') as [string, string]
          userInfo[key] = parseInt(value) || 0
        })
      }
      body = b
    }

    if (isValidSubJson(body)) {
      const config = JSON.parse(body)
      proxies = config.outbounds
      dnsServers = config.dns?.servers || []
    } else if (isValidSubYAML(body)) {
      proxies = parse(body).proxies
    } else if (isValidBase64(body)) {
      proxies = [{ base64: body }]
    } else if (s.type === 'Manual') {
      proxies = JSON.parse(body)
    } else {
      throw 'Not a valid subscription data'
    }

    const pluginStore = usePluginsStore()

    proxies = await pluginStore.onSubscribeTrigger(proxies, s)

    if (proxies.some((proxy) => proxy.name && !proxy.tag) || proxies[0]?.base64) {
      throw 'You need to install the [节点转换] plugin first'
    }

    if (s.type !== 'Manual') {
      const r1 = s.include && buildSmartRegExp(s.include)
      const r2 = s.exclude && buildSmartRegExp(s.exclude)
      const r3 = s.includeProtocol && buildSmartRegExp(s.includeProtocol)
      const r4 = s.excludeProtocol && buildSmartRegExp(s.excludeProtocol)

      proxies = proxies.filter((v) => {
        const flag1 = r1 ? r1.test(v.tag) : true
        const flag2 = r2 ? r2.test(v.tag) : false
        const flag3 = r3 ? r3.test(v.type) : true
        const flag4 = r4 ? r4.test(v.type) : false
        return flag1 && !flag2 && flag3 && !flag4
      })

      if (s.proxyPrefix) {
        proxies.forEach((v) => {
          v.tag = v.tag.startsWith(s.proxyPrefix) ? v.tag : s.proxyPrefix + v.tag
        })
      }
    }

    s.upload = userInfo.upload ?? 0
    s.download = userInfo.download ?? 0
    s.total = userInfo.total ?? 0
    s.expire = userInfo.expire * 1000
    s.updateTime = Date.now()
    s.proxies = proxies.map(({ tag, type }) => {
      // Keep the original ID value of the proxy unchanged
      const id = s.proxies.find((v) => v.tag === tag)?.id || sampleID()
      return { id, tag, type }
    })

    const fn = new window.AsyncFunction(
      'proxies',
      'subscription',
      `${s.script}; return await ${PluginTriggerEvent.OnSubscribe}(proxies, subscription)`,
    ) as (
      proxies: Recordable[],
      subscription: App.Subscription,
    ) => Promise<{ proxies: Recordable[]; subscription: App.Subscription }>

    const { proxies: _proxies, subscription } = await fn(proxies, s)

    Object.assign(s, subscription)
    s.dnsServers = collectReferencedDnsServers(_proxies, dnsServers)
    s.proxies = _proxies.map(({ tag, type }) => {
      // Keep the original ID value of the proxy unchanged
      const id = s.proxies.find((v) => v.tag === tag)?.id || sampleID()
      return { id, tag, type }
    })

    if (s.type === 'Http' || (s.type === 'File' && s.url !== s.path)) {
      proxies = omitArray(_proxies, ['__id__', '__tmp__id__'])
      await WriteFile(s.path, JSON.stringify(proxies, null, 2))
    }
  }

  const updateSubscribe = async (id: string, options: Partial<App.Subscription> = {}) => {
    const s = subscribes.value.find((v) => v.id === id)
    if (!s) throw id + ' Not Found'
    if (s.disabled) throw s.name + ' Disabled'
    try {
      s.updating = true
      await _doUpdateSub(s, options)
      await saveSubscribes()
    } catch (error: any) {
      throw `Failed to update subscription [${s.name}]. Reason: ${error.message || error}`
    } finally {
      s.updating = false
    }

    eventBus.emit('subscriptionChange', { id })

    return `Subscription [${s.name}] updated successfully.`
  }

  const updateSubscribes = async () => {
    let needSave = false

    const update = async (s: App.Subscription) => {
      const result = { ok: true, id: s.id, name: s.name, result: '' }
      try {
        s.updating = true
        await _doUpdateSub(s)
        needSave = true
        result.result = `Subscription [${s.name}] updated successfully.`
      } catch (error: any) {
        result.ok = false
        result.result = `Failed to update subscription [${s.name}]. Reason: ${error.message || error}`
      } finally {
        s.updating = false
      }
      return result
    }

    const result = await asyncPool(
      5,
      subscribes.value.filter((v) => !v.disabled),
      update,
    )

    if (needSave) await saveSubscribes()

    eventBus.emit('subscriptionsChange', undefined)

    return result.flatMap((v) => (v.ok && v.value) || [])
  }

  const getSubscribeById = (id: string) => subscribes.value.find((v) => v.id === id)

  const getSubscribeTemplate = (name = '', options: { url?: string } = {}): App.Subscription => {
    const id = sampleID()
    return {
      id: id,
      name: name,
      upload: 0,
      download: 0,
      total: 0,
      expire: 0,
      updateTime: 0,
      type: 'Http',
      url: options.url || '',
      website: '',
      path: `data/subscribes/${id}.json`,
      include: '',
      exclude: '',
      includeProtocol: '',
      excludeProtocol: DefaultExcludeProtocols,
      proxyPrefix: '',
      requestProxyMode: RequestProxyMode.Global,
      customProxy: '',
      disabled: false,
      inSecure: false,
      requestMethod: RequestMethod.Get,
      requestTimeout: 15,
      header: {
        request: {
          'User-Agent': 'clash.meta/mihomo',
        },
        response: {},
      },
      proxies: [],
      dnsServers: [],
      script: DefaultSubscribeScript,
    }
  }

  return {
    subscribes,
    setupSubscribes,
    saveSubscribes,
    addSubscribe,
    editSubscribe,
    deleteSubscribe,
    updateSubscribe,
    updateSubscribes,
    getSubscribeById,
    importSubscribe,
    getSubscribeTemplate,
  }
})
