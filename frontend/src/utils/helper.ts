import { deleteConnection, getConnections, useProxy } from '@/api/kernel'
import { AbsolutePath, Exec, ExitApp, Readfile, Writefile } from '@/bridge'
import {
  type ProxyType,
  useAppSettingsStore,
  useEnvStore,
  useKernelApiStore,
  usePluginsStore,
} from '@/stores'
import { ignoredError, message, confirm } from '@/utils'

// Permissions Helper
export const SwitchPermissions = async (enable: boolean) => {
  const { basePath, appName } = useEnvStore().env
  const args = enable
    ? [
        'add',
        'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
        '/v',
        basePath + '\\' + appName,
        '/t',
        'REG_SZ',
        '/d',
        'RunAsAdmin',
        '/f',
      ]
    : [
        'delete',
        'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
        '/v',
        basePath + '\\' + appName,
        '/f',
      ]
  await Exec('reg', args, { convert: true })
}

export const CheckPermissions = async () => {
  const { basePath, appName } = useEnvStore().env
  try {
    const out = await Exec(
      'reg',
      [
        'query',
        'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
        '/v',
        basePath + '\\' + appName,
        '/t',
        'REG_SZ',
      ],
      { convert: true },
    )
    return out.includes('RunAsAdmin')
  } catch {
    return false
  }
}

export const GrantTUNPermission = async (path: string) => {
  const { os } = useEnvStore().env
  const absPath = await AbsolutePath(path)
  if (os === 'darwin') {
    const osaScript = `chown root:admin ${absPath}\nchmod +sx ${absPath}`
    const bashScript = `osascript -e 'do shell script "${osaScript}" with administrator privileges'`
    await Exec('bash', ['-c', bashScript])
  } else if (os === 'linux') {
    await Exec('pkexec', [
      'setcap',
      'cap_net_bind_service,cap_net_admin,cap_dac_override=+ep',
      absPath,
    ])
  }
}

// SystemProxy Helper
export const SetSystemProxy = async (
  enable: boolean,
  server: string,
  proxyType: ProxyType = 'mixed',
) => {
  const { os } = useEnvStore().env

  const handler = {
    windows: setWindowsSystemProxy,
    darwin: setDarwinSystemProxy,
    linux: setLinuxSystemProxy,
  }[os]

  await handler?.(server, enable, proxyType)
}

async function setWindowsSystemProxy(server: string, enabled: boolean, proxyType: ProxyType) {
  const p1 = ignoredError(Exec, 'reg', [
    'add',
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    '/v',
    'ProxyEnable',
    '/t',
    'REG_DWORD',
    '/d',
    enabled ? '1' : '0',
    '/f',
  ])

  const p2 = ignoredError(Exec, 'reg', [
    'add',
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    '/v',
    'ProxyServer',
    '/d',
    enabled ? (proxyType === 'socks' ? 'socks=' + server : server) : '',
    '/f',
  ])

  await Promise.all([p1, p2])
}

async function setDarwinSystemProxy(server: string, enabled: boolean, proxyType: ProxyType) {
  async function _set(device: string) {
    const state = enabled ? 'on' : 'off'

    const httpState = ['mixed', 'http'].includes(proxyType) ? state : 'off'
    const socksState = ['mixed', 'socks'].includes(proxyType) ? state : 'off'

    const p1 = ignoredError(Exec, 'networksetup', ['-setwebproxystate', device, httpState])
    const p2 = ignoredError(Exec, 'networksetup', ['-setsecurewebproxystate', device, httpState])
    const p3 = ignoredError(Exec, 'networksetup', [
      '-setsocksfirewallproxystate',
      device,
      socksState,
    ])

    const [serverName, serverPort] = server.split(':')

    const promises = [p1, p2, p3]
    if (httpState === 'on') {
      const p1 = ignoredError(Exec, 'networksetup', [
        '-setwebproxy',
        device,
        serverName,
        serverPort,
      ])
      const p2 = ignoredError(Exec, 'networksetup', [
        '-setsecurewebproxy',
        device,
        serverName,
        serverPort,
      ])
      promises.push(p1, p2)
    }
    if (socksState === 'on') {
      const p1 = ignoredError(Exec, 'networksetup', [
        '-setsocksfirewallproxy',
        device,
        serverName,
        serverPort,
      ])
      promises.push(p1)
    }

    await Promise.all(promises)
  }
  const p1 = _set('Ethernet')
  const p2 = _set('Wi-Fi')
  await Promise.all([p1, p2])
}

async function setLinuxSystemProxy(server: string, enabled: boolean, proxyType: ProxyType) {
  const [serverName, serverPort] = server.split(':')
  const httpEnabled = enabled && ['mixed', 'http'].includes(proxyType)
  const socksEnabled = enabled && ['mixed', 'socks'].includes(proxyType)

  const desktop = (await Exec('sh', ['-c', 'echo $XDG_CURRENT_DESKTOP'])).trim()
  if (desktop.includes('KDE')) {
    const p1 = ignoredError(Exec, 'kwriteconfig5', [
      '--file',
      'kioslaverc',
      '--group',
      'Proxy Settings',
      '--key',
      'ProxyType',
      enabled ? '1' : '0',
    ])
    const p2 = ignoredError(Exec, 'kwriteconfig5', [
      '--file',
      'kioslaverc',
      '--group',
      'Proxy Settings',
      '--key',
      'httpProxy',
      httpEnabled ? `http://${server}` : '',
    ])
    const p3 = ignoredError(Exec, 'kwriteconfig5', [
      '--file',
      'kioslaverc',
      '--group',
      'Proxy Settings',
      '--key',
      'httpsProxy',
      httpEnabled ? `http://${server}` : '',
    ])
    const p4 = ignoredError(Exec, 'kwriteconfig5', [
      '--file',
      'kioslaverc',
      '--group',
      'Proxy Settings',
      '--key',
      'socksProxy',
      socksEnabled ? `socks://${server}` : '',
    ])
    await Promise.all([p1, p2, p3, p4])
  } else if (desktop.includes('GNOME')) {
    const p1 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy',
      'mode',
      enabled ? 'manual' : 'none',
    ])
    const p2 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy.http',
      'host',
      httpEnabled ? serverName : '',
    ])
    const p3 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy.http',
      'port',
      httpEnabled ? serverPort : '0',
    ])
    const p4 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy.https',
      'host',
      httpEnabled ? serverName : '',
    ])
    const p5 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy.https',
      'port',
      httpEnabled ? serverPort : '0',
    ])
    const p6 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy.socks',
      'host',
      socksEnabled ? serverName : '',
    ])
    const p7 = ignoredError(Exec, 'gsettings', [
      'set',
      'org.gnome.system.proxy.socks',
      'port',
      socksEnabled ? serverPort : '0',
    ])
    await Promise.all([p1, p2, p3, p4, p5, p6, p7])
  }
}

export const GetSystemProxy = async () => {
  const { os } = useEnvStore().env
  try {
    if (os === 'windows') {
      const out1 = await Exec('reg', [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
        '/v',
        'ProxyEnable',
        '/t',
        'REG_DWORD',
      ])

      if (/REG_DWORD\s+0x0/.test(out1)) return ''

      const out2 = await Exec('reg', [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
        '/v',
        'ProxyServer',
        '/t',
        'REG_SZ',
      ])

      const regex = /ProxyServer\s+REG_SZ\s+(\S+)/
      const match = out2.match(regex)

      return match ? (match[1].startsWith('socks') ? match[1] : 'http://' + match[1]) : ''
    }

    if (os === 'darwin') {
      const out = await Exec('scutil', ['--proxy'])
      const regex =
        /(?:HTTPEnable|HTTPPort|HTTPProxy|SOCKSEnable|SOCKSPort|SOCKSProxy)\s*:\s*([^}\n]+)/g
      const map: Record<string, any> = {}
      let match

      while ((match = regex.exec(out)) !== null) {
        const value = match[1].trim()
        const key = match[0].split(':')[0].trim()
        map[key] = value
      }

      if (map['HTTPEnable'] === '1') {
        return 'http://' + map['HTTPProxy'] + ':' + map['HTTPPort']
      }

      if (map['SOCKSEnable'] === '1') {
        return 'socks5://' + map['SOCKSProxy'] + ':' + map['SOCKSPort']
      }

      return ''
    }

    if (os === 'linux') {
      const desktop = (await Exec('sh', ['-c', 'echo $XDG_CURRENT_DESKTOP'])).trim()
      if (desktop.includes('KDE')) {
        const out = await Exec('kreadconfig5', [
          '--file',
          'kioslaverc',
          '--group',
          'Proxy Settings',
          '--key',
          'ProxyType',
        ])
        if (out.includes('1')) {
          const out1 = await Exec('kreadconfig5', [
            '--file',
            'kioslaverc',
            '--group',
            'Proxy Settings',
            '--key',
            'httpProxy',
          ])
          const http = out1.replace(/['"\n]/g, '')
          if (http) {
            return http.replace(' ', ':')
          }
          const out2 = await Exec('kreadconfig5', [
            '--file',
            'kioslaverc',
            '--group',
            'Proxy Settings',
            '--key',
            'socksProxy',
          ])
          const socks = out2.replace(/['"\n]/g, '')
          if (socks) {
            return socks.replace(' ', ':')
          }
        }
      } else if (desktop.includes('GNOME')) {
        const out = await Exec('gsettings', ['get', 'org.gnome.system.proxy', 'mode'])
        if (out.includes('none')) {
          return ''
        }

        if (out.includes('manual')) {
          const out1 = await Exec('gsettings', ['get', 'org.gnome.system.proxy.http', 'host'])
          const out2 = await Exec('gsettings', ['get', 'org.gnome.system.proxy.http', 'port'])
          const httpHost = out1.replace(/['"\n]/g, '')
          const httpPort = out2.replace(/['"\n]/g, '')
          if (httpHost && httpPort !== '0') {
            return 'http://' + httpHost + ':' + httpPort
          }

          const out3 = await Exec('gsettings', ['get', 'org.gnome.system.proxy.socks', 'host'])
          const out4 = await Exec('gsettings', ['get', 'org.gnome.system.proxy.socks', 'port'])
          const socksHost = out3.replace(/['"\n]/g, '')
          const socksPort = out4.replace(/['"\n]/g, '')
          if (socksHost && socksPort !== '0') {
            return 'socks5://' + socksHost + ':' + socksPort
          }
        }
      }
    }
  } catch (error) {
    console.log('error', error)
  }
  return ''
}

const proxy_cache: { proxyPromise: Promise<string> | null; lastAccessTime: number } = {
  proxyPromise: null,
  lastAccessTime: 0,
}

export const GetSystemOrKernelProxy = async () => {
  if (useAppSettingsStore().app.kernel.running) {
    const kernelProxy = useKernelApiStore().getProxyPort()
    if (kernelProxy !== undefined) {
      if (kernelProxy.proxyType === 'socks') {
        return `socks5://127.0.0.1:${kernelProxy.port}`
      }
      return `http://127.0.0.1:${kernelProxy.port}`
    }
  }

  if (proxy_cache.proxyPromise && Date.now() - proxy_cache.lastAccessTime < 1000) {
    return proxy_cache.proxyPromise
  }

  proxy_cache.lastAccessTime = Date.now()
  proxy_cache.proxyPromise = GetSystemProxy()
  return proxy_cache.proxyPromise
}

export const QuerySchTask = async (taskName: string) => {
  await Exec('Schtasks', ['/Query', '/TN', taskName, '/XML'], { convert: true })
}

export const CreateSchTask = async (taskName: string, xmlPath: string) => {
  await Exec('SchTasks', ['/Create', '/F', '/TN', taskName, '/XML', xmlPath], { convert: true })
}

export const DeleteSchTask = async (taskName: string) => {
  await Exec('SchTasks', ['/Delete', '/F', '/TN', taskName], { convert: true })
}

// Others
export const handleUseProxy = async (group: any, proxy: any) => {
  if (group.type !== 'Selector' || group.now === proxy.name) return
  const promises: Promise<null>[] = []
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()
  if (appSettings.app.kernel.autoClose) {
    const { connections } = await getConnections()
    promises.push(
      ...(connections || [])
        .filter((v) => v.chains.includes(group.name))
        .map((v) => deleteConnection(v.id)),
    )
  }
  await useProxy(group.name, proxy.name)
  await Promise.all(promises)
  await kernelApiStore.refreshProviderProxies()
}

export const handleChangeMode = async (mode: 'direct' | 'global' | 'rule') => {
  const kernelApiStore = useKernelApiStore()

  if (mode === kernelApiStore.config.mode) return

  kernelApiStore.updateConfig('mode', mode)

  const { connections } = await getConnections()
  const promises = (connections || []).map((v) => deleteConnection(v.id))
  await Promise.all(promises)
}

export const addToRuleSet = async (
  ruleset: 'direct' | 'reject' | 'block',
  payloads: Record<string, any>[],
) => {
  const path = `data/rulesets/${ruleset}.json`
  const content = (await ignoredError(Readfile, path)) || '{ "version": 1, "rules": [] }'
  const { rules = [] } = JSON.parse(content)
  rules[0] = rules[0] || {}
  payloads.forEach((payload) => {
    if (payload.domain) {
      rules[0].domain = [...new Set((rules[0].domain || []).concat(payload.domain))]
    } else if (payload.ip_cidr) {
      rules[0].ip_cidr = [...new Set((rules[0].ip_cidr || []).concat(payload.ip_cidr))]
    } else if (payload.process_path) {
      rules[0].process_path = [
        ...new Set((rules[0].process_path || []).concat(payload.process_path)),
      ]
    } else if (payload.domain_suffix) {
      rules[0].domain_suffix = [
        ...new Set((rules[0].domain_suffix || []).concat(payload.domain_suffix)),
      ]
    }
  })
  await Writefile(path, JSON.stringify({ version: 1, rules }, null, 2))
}

export const exitApp = async () => {
  const envStore = useEnvStore()
  const pluginsStore = usePluginsStore()
  const appSettings = useAppSettingsStore()
  const kernelApiStore = useKernelApiStore()

  if (appSettings.app.kernel.running && appSettings.app.closeKernelOnExit) {
    await kernelApiStore.stopKernel()
    if (appSettings.app.autoSetSystemProxy) {
      envStore.clearSystemProxy()
    }
  }

  let canceled = false
  let timedout = false

  const { destroy, error } = message.info('titlebar.waiting', 10 * 60 * 1000)

  setTimeout(async () => {
    timedout = true
    canceled = !(await confirm('Tips', 'titlebar.timeout').catch(() => destroy()))
    !canceled && ExitApp()
  }, 10_000)

  try {
    await pluginsStore.onShutdownTrigger()
    !timedout && ExitApp()
  } catch (err: any) {
    error(err)
  }
}

export const getKernelFileName = (isAlpha = false) => {
  const envStore = useEnvStore()
  const { os } = envStore.env
  const fileSuffix = { windows: '.exe', linux: '', darwin: '' }[os]
  const latest = isAlpha ? '-latest' : ''
  return `sing-box${latest}${fileSuffix}`
}

export const getKernelAssetFileName = (version: string, isAlpha = false) => {
  const envStore = useEnvStore()
  const { os, arch } = envStore.env
  const legacy =
    (os === 'windows' || (os === 'darwin' && !isAlpha)) &&
    arch === 'amd64' &&
    envStore.env.x64Level < 3
      ? '-legacy'
      : ''
  const suffix = { windows: '.zip', linux: '.tar.gz', darwin: '.tar.gz' }[os]
  return `sing-box-${version}-${os}-${arch}${legacy}${suffix}`
}
