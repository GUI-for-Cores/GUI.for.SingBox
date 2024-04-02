import { ref } from 'vue'
import { defineStore } from 'pinia'
import { stringify, parse } from 'yaml'

import { SubscribesFilePath } from '@/constant'
import { usePluginsStore } from '@/stores'
import { Readfile, Writefile, HttpGet } from '@/bridge'
import {
  deepClone,
  debounce,
  sampleID,
  isValidSubJson,
  getUserAgent,
  isValidSubYAML
} from '@/utils'

export type SubscribeType = {
  id: string
  name: string
  upload: number
  download: number
  total: number
  expire: string
  updateTime: string
  type: 'Http' | 'File' | 'Manual'
  url: string
  website: string
  path: string
  include: string
  exclude: string
  includeProtocol: string
  excludeProtocol: string
  proxyPrefix: string
  disabled: boolean
  proxies: { id: string; tag: string; type: string }[]
  userAgent: string
  // Not Config
  updating?: boolean
}

export const useSubscribesStore = defineStore('subscribes', () => {
  const subscribes = ref<SubscribeType[]>([])

  const setupSubscribes = async () => {
    const data = await Readfile(SubscribesFilePath)
    subscribes.value = parse(data)
  }

  const saveSubscribes = debounce(async () => {
    const s = deepClone(subscribes.value)
    for (let i = 0; i < s.length; i++) {
      delete s[i].updating
    }
    await Writefile(SubscribesFilePath, stringify(s))
  }, 500)

  const addSubscribe = async (s: SubscribeType) => {
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
      expire: '',
      updateTime: '',
      type: 'Http',
      url: url,
      website: '',
      path: `data/subscribes/${id}.json`,
      include: '',
      exclude: '',
      includeProtocol: '',
      excludeProtocol: '',
      proxyPrefix: '',
      disabled: false,
      userAgent: '',
      proxies: []
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

  const editSubscribe = async (id: string, s: SubscribeType) => {
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

  const _doUpdateSub = async (s: SubscribeType) => {
    const pattern = /upload=(\d*); download=(\d*); total=(\d*); expire=(\d*)/
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
      const { header: h, body: b } = await HttpGet(s.url, {
        'User-Agent': s.userAgent || getUserAgent()
      })

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
    } else {
      throw 'Not a valid subscription data'
    }

    const pluginStore = usePluginsStore()

    if (s.type !== 'Manual') {
      proxies = proxies.filter((v: any) => {
        const name_tag = v.tag || v.name
        const flag1 = s.include ? new RegExp(s.include).test(name_tag) : true
        const flag2 = s.exclude ? !new RegExp(s.exclude).test(name_tag) : true
        const flag3 = s.includeProtocol ? new RegExp(s.includeProtocol).test(v.type) : true
        const flag4 = s.excludeProtocol ? !new RegExp(s.excludeProtocol).test(v.type) : true
        return flag1 && flag2 && flag3 && flag4
      })

      if (s.proxyPrefix) {
        proxies = proxies.map((v) => {
          const name_tag = v.name ? 'name' : 'tag'
          return {
            ...v,
            [name_tag]: v[name_tag].startsWith(s.proxyPrefix)
              ? v[name_tag]
              : s.proxyPrefix + v[name_tag]
          }
        })
      }
    }

    proxies = await pluginStore.onSubscribeTrigger(proxies, s)

    await Writefile(s.path, JSON.stringify(proxies, null, 2))

    const match = userInfo.match(pattern) || [0, 0, 0, 0, 0]

    const [, upload = 0, download = 0, total = 0, expire = 0] = match
    s.upload = Number(upload)
    s.download = Number(download)
    s.total = Number(total)
    s.expire = Number(expire) ? new Date(Number(expire) * 1000).toLocaleString() : ''
    s.updateTime = new Date().toLocaleString()
    s.proxies = proxies.map(({ tag, type }) => {
      // Keep the original ID value of the proxy unchanged
      const id = s.proxies.find((v) => v.tag === tag)?.id || sampleID()
      return { id, tag, type }
    })
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
    for (let i = 0; i < subscribes.value.length; i++) {
      const s = subscribes.value[i]
      if (s.disabled) continue
      try {
        s.updating = true
        await _doUpdateSub(s)
        needSave = true
      } finally {
        s.updating = false
      }
    }
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
    importSubscribe
  }
})
