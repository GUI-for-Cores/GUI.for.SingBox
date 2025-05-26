import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stringify, parse } from 'yaml'

import { Readfile, Writefile, HttpGet } from '@/bridge'
import { DefaultSubscribeScript, SubscribesFilePath } from '@/constant/app'
import { DefaultExcludeProtocols } from '@/constant/kernel'
import { PluginTriggerEvent } from '@/enums/app'
import { usePluginsStore } from '@/stores'
import {
  debounce,
  sampleID,
  isValidSubJson,
  getUserAgent,
  isValidSubYAML,
  isValidBase64,
  ignoredError,
  omitArray,
  asyncPool,
} from '@/utils'

import type { Subscription } from '@/types/app'

export const useSubscribesStore = defineStore('subscribes', () => {
  const subscribes = ref<Subscription[]>([])

  const setupSubscribes = async () => {
    const data = await ignoredError(Readfile, SubscribesFilePath)
    data && (subscribes.value = parse(data))

    let needSync = false
    subscribes.value.forEach((sub) => {
      if (!sub.script) {
        sub.script = DefaultSubscribeScript
        needSync = true
      }
    })

    if (needSync) {
      await saveSubscribes()
    }
  }

  const saveSubscribes = debounce(async () => {
    const s = omitArray(subscribes.value, ['updating'])
    await Writefile(SubscribesFilePath, stringify(s))
  }, 500)

  const addSubscribe = async (s: Subscription) => {
    subscribes.value.push(s)
    try {
      await saveSubscribes()
    } catch (error) {
      subscribes.value.pop()
      throw error
    }
  }

  const importSubscribe = async (name: string, url: string) => {
    const id = sampleID()
    await addSubscribe({
      id: id,
      name: name,
      upload: 0,
      download: 0,
      total: 0,
      expire: 0,
      updateTime: 0,
      type: 'Http',
      url: url,
      website: '',
      path: `data/subscribes/${id}.json`,
      include: '',
      exclude: '',
      includeProtocol: '',
      excludeProtocol: DefaultExcludeProtocols,
      proxyPrefix: '',
      disabled: false,
      inSecure: false,
      userAgent: '',
      proxies: [],
      script: DefaultSubscribeScript,
    })
  }

  const deleteSubscribe = async (id: string) => {
    const idx = subscribes.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = subscribes.value.splice(idx, 1)[0]
    try {
      await saveSubscribes()
    } catch (error) {
      subscribes.value.splice(idx, 0, backup)
      throw error
    }
  }

  const editSubscribe = async (id: string, s: Subscription) => {
    const idx = subscribes.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = subscribes.value.splice(idx, 1, s)[0]
    try {
      await saveSubscribes()
    } catch (error) {
      subscribes.value.splice(idx, 1, backup)
      throw error
    }
  }

  const _doUpdateSub = async (s: Subscription) => {
    const pattern =
      /upload=(-?)([E+.\d]+);\s*download=(-?)([E+.\d]+);\s*total=([E+.\d]+);\s*expire=(\d*)/
    let userInfo = 'upload=0; download=0; total=0; expire=0'
    let body = ''
    let proxies: Record<string, any>[] = []

    if (s.type === 'Manual') {
      body = await Readfile(s.path)
    }

    if (s.type === 'File') {
      body = await Readfile(s.url)
    }

    if (s.type === 'Http') {
      const { headers: h, body: b } = await HttpGet(
        s.url,
        {
          'User-Agent': s.userAgent || getUserAgent(),
        },
        { Insecure: s.inSecure },
      )

      h['Subscription-Userinfo'] && (userInfo = h['Subscription-Userinfo'])
      if (typeof b !== 'string') {
        body = JSON.stringify(b)
      } else {
        body = b
      }
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
      proxies = proxies.filter((v: any) => {
        const flag1 = s.include ? new RegExp(s.include).test(v.tag) : true
        const flag2 = s.exclude ? !new RegExp(s.exclude).test(v.tag) : true
        const flag3 = s.includeProtocol ? new RegExp(s.includeProtocol).test(v.type) : true
        const flag4 = s.excludeProtocol ? !new RegExp(s.excludeProtocol).test(v.type) : true
        return flag1 && flag2 && flag3 && flag4
      })

      if (s.proxyPrefix) {
        proxies.forEach((v) => {
          v.tag = v.tag.startsWith(s.proxyPrefix) ? v.tag : s.proxyPrefix + v.tag
        })
      }
    }

    const match = userInfo.match(pattern) || [0, 0, 0, 0, 0]

    const [, , upload = 0, , download = 0, total = 0, expire = 0] = match
    s.upload = Number(upload)
    s.download = Number(download)
    s.total = Number(total)
    s.expire = Number(expire) * 1000
    s.updateTime = Date.now()
    s.proxies = proxies.map(({ tag, type }) => {
      // Keep the original ID value of the proxy unchanged
      const id = s.proxies.find((v) => v.tag === tag)?.id || sampleID()
      return { id, tag, type }
    })

    const fn = new window.AsyncFunction(
      `${s.script};return await ${PluginTriggerEvent.OnSubscribe}(${JSON.stringify(proxies)}, ${JSON.stringify(s)})`,
    ) as () => Promise<{ proxies: Recordable<any>[]; subscription: Subscription }>

    const { proxies: _proxies, subscription } = await fn()

    Object.assign(s, subscription)
    s.proxies = _proxies.map(({ tag, type }) => {
      // Keep the original ID value of the proxy unchanged
      const id = s.proxies.find((v) => v.tag === tag)?.id || sampleID()
      return { id, tag, type }
    })

    await Writefile(s.path, JSON.stringify(_proxies, null, 2))
  }

  const updateSubscribe = async (id: string) => {
    const s = subscribes.value.find((v) => v.id === id)
    if (!s) throw id + ' Not Found'
    if (s.disabled) throw s.name + ' Disabled'
    try {
      s.updating = true
      await _doUpdateSub(s)
      await saveSubscribes()
      return `Subscription [${s.name}] updated successfully.`
    } catch (error) {
      console.error('updateSubscribe: ', s.name, error)
      throw error
    } finally {
      s.updating = false
    }
  }

  const updateSubscribes = async () => {
    let needSave = false

    const update = async (s: Subscription) => {
      try {
        s.updating = true
        await _doUpdateSub(s)
        needSave = true
      } finally {
        s.updating = false
      }
    }

    await asyncPool(
      5,
      subscribes.value.filter((v) => !v.disabled),
      update,
    )

    if (needSave) saveSubscribes()
  }

  const getSubscribeById = (id: string) => subscribes.value.find((v) => v.id === id)

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
  }
})
