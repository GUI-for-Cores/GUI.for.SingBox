import { ref } from 'vue'
import { defineStore } from 'pinia'
import { stringify, parse } from 'yaml'

import {
  Readfile,
  Writefile,
  HttpGet,
  FileExists,
  Removefile,
  Exec,
  AbsolutePath
} from '@/utils/bridge'
import { SubscribesFilePath } from '@/constant'
import { deepClone, debounce, sampleID, APP_TITLE, isValidSubJson } from '@/utils'
import { useAppSettingsStore, useSubconverterStore, usePluginsStore } from '@/stores'

export type SubscribeType = {
  id: string
  name: string
  upload: number
  download: number
  total: number
  expire: string
  updateTime: string
  type: 'Http' | 'File' | 'Manual'
  convert: true
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
      convert: true,
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

  const convertSub = async (path: string, subconverter: string, workDir: string) => {
    const tmpFile = workDir + '/tmp.json'
    try {
      await Exec(subconverter, ['--path', path, '--out', await AbsolutePath(tmpFile)])
      if (await FileExists(tmpFile)) {
        return await Readfile(tmpFile)
      }
    } finally {
      Removefile(tmpFile)
    }
    return ''
  }

  const downloadSub = async (
    url: string,
    userAgent: string,
    subconverter: string,
    workDir: string
  ) => {
    const tmpFile = workDir + '/tmp.json'
    try {
      const out = await Exec(subconverter, [
        '--url',
        url.split(/[ |]/).join('\n'),
        '--ua',
        userAgent,
        '--out',
        await AbsolutePath(tmpFile)
      ])
      if (await FileExists(tmpFile)) {
        const body = await Readfile(tmpFile)
        const outs = out.trim().split('\n')
        const header = outs.length > 0 ? outs[outs.length - 1] : ''
        try {
          return { header: JSON.parse(header), body: body }
        } catch (e) {
          return { header: '', body: body }
        }
      }
    } finally {
      Removefile(tmpFile)
    }
    return { header: '', body: '' }
  }

  const downloadSubFallback = async (url: string, userAgent: string) => {
    // if (s.convert) {
    //   const converterUrl =
    //     'https://sing-box-subscribe.vercel.app/config/url=' + url + '/&ua=' + userAgent
    //   const { body: b } = await HttpGet(converterUrl, {
    //     'User-Agent': userAgent
    //   })

    //   const { header: h } = await HttpGet(url, {
    //     'User-Agent': userAgent
    //   })
    //   return {header: h, body: b}
    // }
    return await HttpGet(url, {
      'User-Agent': userAgent
    })
  }

  const _doUpdateSub = async (s: SubscribeType) => {
    const pattern = /upload=(\d*); download=(\d*); total=(\d*); expire=(\d*)/
    let userInfo = 'upload=0; download=0; total=0; expire=0'
    let body = ''
    let proxies: Record<string, any>[] = []

    if (s.type === 'Manual') {
      if (s.path.length == 0) {
        throw 'Subscription file path is empty'
      }
      if (await FileExists(s.path)) {
        body = await Readfile(s.path)
      } else {
        body = '[]'
      }
    } else if (s.type === 'File') {
      if (await FileExists(s.url)) {
        if (s.convert) {
          const subconverter = useSubconverterStore()
          await subconverter.ensureInitialized()
          if (subconverter.SUBCONVERTER_EXISTS) {
            try {
              body = await convertSub(
                s.url,
                subconverter.SUBCONVERTER_PATH,
                subconverter.SUBCONVERTER_DIR
              )
            } catch (error) {
              console.error('UpdateSub', error)
            }
          }
        }
        if (body.length == 0) {
          body = await Readfile(s.url)
        }
      } else if (s.url === s.path) {
        body = '[]'
      } else {
        throw 'Subscription file not exist'
      }
    } else if (s.type === 'Http') {
      const appSettings = useAppSettingsStore()
      const userAgent = s.userAgent || appSettings.app.userAgent || APP_TITLE

      let header: any = {}

      if (s.convert) {
        const subconverter = useSubconverterStore()
        await subconverter.ensureInitialized()
        if (subconverter.SUBCONVERTER_EXISTS) {
          try {
            const { header: h, body: b } = await downloadSub(
              s.url,
              userAgent,
              subconverter.SUBCONVERTER_PATH,
              subconverter.SUBCONVERTER_DIR
            )
            body = b
            header = h
          } catch (error) {
            console.error('UpdateSub', error)
          }
        }
      }

      if (body.length == 0) {
        const { header: h, body: b } = await downloadSubFallback(s.url, userAgent)
        body = b
        header = h
      }

      for (const headerKey of Object.keys(header)) {
        if (headerKey.toLowerCase() === 'subscription-userinfo') {
          if (Array.isArray(header[headerKey])) {
            userInfo = header[headerKey][0]
          } else {
            userInfo = header[headerKey]
          }
          break
        }
      }
    }

    if (isValidSubJson(body)) {
      proxies = JSON.parse(body).outbounds ?? []
    } else {
      try {
        proxies = JSON.parse(body)
      } catch (error) {
        throw 'Not a valid subscription file'
      }
    }

    const pluginStore = usePluginsStore()

    proxies = await pluginStore.onSubscribeTrigger(proxies, s)

    if (s.type !== 'Manual') {
      proxies = proxies.filter((v: any) => {
        if ('tag' in v) {
          const flag1 = s.include ? new RegExp(s.include).test(v.tag) : true
          const flag2 = s.exclude ? !new RegExp(s.exclude).test(v.tag) : true
          const flag3 = s.includeProtocol ? new RegExp(s.includeProtocol).test(v.type) : true
          const flag4 = s.excludeProtocol ? !new RegExp(s.excludeProtocol).test(v.type) : true
          return flag1 && flag2 && flag3 && flag4
        }
        return false
      })

      if (s.proxyPrefix) {
        proxies = proxies.map((v) => ({
          ...v,
          tag: v.tag.startsWith(s.proxyPrefix) ? v.tag : s.proxyPrefix + v.tag
        }))
      }
    }

    await Writefile(s.path, JSON.stringify(proxies, null, 2))

    const match = userInfo.match(pattern) || [0, 0, 0, 0, 0]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, upload = 0, download = 0, total = 0, expire = 0] = match
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
