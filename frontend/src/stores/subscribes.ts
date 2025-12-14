import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parse } from 'yaml'

import { ReadFile, WriteFile, Requests } from '@/bridge'
import { DefaultSubscribeScript, SubscribesFilePath } from '@/constant/app'
import { DefaultExcludeProtocols } from '@/constant/kernel'
import { PluginTriggerEvent, RequestMethod } from '@/enums/app'
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
} from '@/utils'

import type { Subscription } from '@/types/app'

export const useSubscribesStore = defineStore('subscribes', () => {
  const subscribes = ref<Subscription[]>([])

  const setupSubscribes = async () => {
    const data = await ignoredError(ReadFile, SubscribesFilePath)
    data && (subscribes.value = parse(data))
  }

  const saveSubscribes = () => {
    const s = omitArray(subscribes.value, ['updating'])
    return WriteFile(SubscribesFilePath, stringifyNoFolding(s))
  }

  const addSubscribe = async (s: Subscription) => {
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

  const editSubscribe = async (id: string, s: Subscription) => {
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

  const _doUpdateSub = async (s: Subscription) => {
    const userInfo: Recordable = {}
    let body = ''
    let proxies: Record<string, any>[] = []

    if (s.type === 'Manual') {
      body = await ReadFile(s.path)
    }

    if (s.type === 'File') {
      body = await ReadFile(s.url)
    }

    if (s.type === 'Http') {
      const { headers: h, body: b } = await Requests({
        method: s.requestMethod,
        url: s.url,
        headers: s.header.request,
        autoTransformBody: false,
        options: {
          Insecure: s.inSecure,
          Timeout: s.requestTimeout,
        },
      })
      Object.assign(h, s.header.response)
      if (h['Subscription-Userinfo']) {
        ;(h['Subscription-Userinfo'] as string).split(/\s*;\s*/).forEach((part) => {
          const [key, value] = part.split('=') as [string, string]
          userInfo[key] = parseInt(value) || 0
        })
      }
      body = b
    }

    if (isValidSubJson(body)) {
      proxies = JSON.parse(body).outbounds
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
      subscription: Subscription,
    ) => Promise<{ proxies: Recordable[]; subscription: Subscription }>

    const { proxies: _proxies, subscription } = await fn(proxies, s)

    Object.assign(s, subscription)
    s.proxies = _proxies.map(({ tag, type }) => {
      // Keep the original ID value of the proxy unchanged
      const id = s.proxies.find((v) => v.tag === tag)?.id || sampleID()
      return { id, tag, type }
    })

    await WriteFile(s.path, JSON.stringify(_proxies, null, 2))
  }

  const updateSubscribe = async (id: string) => {
    const s = subscribes.value.find((v) => v.id === id)
    if (!s) throw id + ' Not Found'
    if (s.disabled) throw s.name + ' Disabled'
    try {
      s.updating = true
      await _doUpdateSub(s)
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

    const update = async (s: Subscription) => {
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

  const getSubscribeTemplate = (name = '', options: { url?: string } = {}): Subscription => {
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
      disabled: false,
      inSecure: false,
      requestMethod: RequestMethod.Get,
      requestTimeout: 15,
      header: {
        request: {},
        response: {},
      },
      proxies: [],
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
