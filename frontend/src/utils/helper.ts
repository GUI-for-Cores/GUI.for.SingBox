import { ignoredError, APP_TITLE } from '@/utils'
import { deleteConnection, getConnections, useProxy } from '@/api/kernel'
import { useAppSettingsStore, useEnvStore, useKernelApiStore, usePluginsStore } from '@/stores'
import { Exec, ExitApp, Readfile, Writefile } from '@/bridge'

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
        '/f'
      ]
    : [
        'delete',
        'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers',
        '/v',
        basePath + '\\' + appName,
        '/f'
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
        'REG_SZ'
      ],
      { convert: true }
    )
    return out.includes('RunAsAdmin')
  } catch (error) {
    return false
  }
}

// SystemProxy Helper
export const SetSystemProxy = async (enable: boolean, server: string, proxyType = 0) => {
  const { os } = useEnvStore().env

  if (os === 'windows') {
    setWindowsSystemProxy(server, enable, proxyType)
    return
  }

  if (os === 'darwin') {
    setDarwinSystemProxy(server, enable, proxyType)
    return
  }

  if (os === 'linux') {
    setLinuxSystemProxy(server, enable, proxyType)
  }
}

function setWindowsSystemProxy(server: string, enabled: boolean, proxyType: number) {
  if (proxyType === 2) throw 'home.overview.notSupportSocks'

  ignoredError(
    Exec,
    'reg',
    [
      'add',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      '/v',
      'ProxyEnable',
      '/t',
      'REG_DWORD',
      '/d',
      enabled ? '1' : '0',
      '/f'
    ],
    { convert: true }
  )

  ignoredError(
    Exec,
    'reg',
    [
      'add',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      '/v',
      'ProxyServer',
      '/d',
      enabled ? server : '',
      '/f'
    ],
    { convert: true }
  )
}

function setDarwinSystemProxy(server: string, enabled: boolean, proxyType: number) {
  function _set(device: string) {
    const state = enabled ? 'on' : 'off'

    const httpState = [0, 1].includes(proxyType) ? state : 'off'
    const socksState = [0, 2].includes(proxyType) ? state : 'off'

    ignoredError(Exec, 'networksetup', ['-setwebproxystate', device, httpState])
    ignoredError(Exec, 'networksetup', ['-setsecurewebproxystate', device, httpState])
    ignoredError(Exec, 'networksetup', ['-setsocksfirewallproxystate', device, socksState])

    const [serverName, serverPort] = server.split(':')

    if (httpState === 'on') {
      ignoredError(Exec, 'networksetup', ['-setwebproxy', device, serverName, serverPort])
      ignoredError(Exec, 'networksetup', ['-setsecurewebproxy', device, serverName, serverPort])
    }
    if (socksState === 'on') {
      ignoredError(Exec, 'networksetup', ['-setsocksfirewallproxy', device, serverName, serverPort])
    }
  }
  _set('Ethernet')
  _set('Wi-Fi')
}

function setLinuxSystemProxy(server: string, enabled: boolean, proxyType: number) {
  const [serverName, serverPort] = server.split(':')
  const httpEnabled = enabled && [0, 1].includes(proxyType)
  const socksEnabled = enabled && [0, 2].includes(proxyType)

  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy',
    'mode',
    enabled ? 'manual' : 'none'
  ])
  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy.http',
    'host',
    httpEnabled ? serverName : ''
  ])
  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy.http',
    'port',
    httpEnabled ? serverPort : '0'
  ])
  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy.https',
    'host',
    httpEnabled ? serverName : ''
  ])
  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy.https',
    'port',
    httpEnabled ? serverPort : '0'
  ])
  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy.socks',
    'host',
    socksEnabled ? serverName : ''
  ])
  ignoredError(Exec, 'gsettings', [
    'set',
    'org.gnome.system.proxy.socks',
    'port',
    socksEnabled ? serverPort : '0'
  ])
}

export const GetSystemProxy = async () => {
  const { os } = useEnvStore().env
  try {
    if (os === 'windows') {
      const out1 = await Exec(
        'reg',
        [
          'query',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
          '/v',
          'ProxyEnable',
          '/t',
          'REG_DWORD'
        ],
        { convert: true }
      )

      if (/REG_DWORD\s+0x0/.test(out1)) return ''

      const out2 = await Exec(
        'reg',
        [
          'query',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
          '/v',
          'ProxyServer',
          '/t',
          'REG_SZ'
        ],
        { convert: true }
      )

      const regex = /ProxyServer\s+REG_SZ\s+(\S+)/
      const match = out2.match(regex)

      return match ? match[1] : ''
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
        return map['HTTPProxy'] + ':' + map['HTTPPort']
      }

      if (map['SOCKSEnable'] === '1') {
        return map['SOCKSProxy'] + ':' + map['SOCKSPort']
      }

      return ''
    }

    if (os === 'linux') {
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
          return httpHost + ':' + httpPort
        }

        const out3 = await Exec('gsettings', ['get', 'org.gnome.system.proxy.socks', 'host'])
        const out4 = await Exec('gsettings', ['get', 'org.gnome.system.proxy.socks', 'port'])
        const socksHost = out3.replace(/['"\n]/g, '')
        const socksPort = out4.replace(/['"\n]/g, '')
        if (socksHost && socksPort !== '0') {
          return socksHost + ':' + socksPort
        }
      }
    }
  } catch (error) {
    console.log('error', error)
  }
  return ''
}

// System ScheduledTask Helper
export const getTaskSchXmlString = async (delay = 30) => {
  const { basePath, appName } = useEnvStore().env

  const xml = /*xml*/ `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>${APP_TITLE} at startup</Description>
    <URI>\\${APP_TITLE}</URI>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <Delay>PT${delay}S</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT72H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${basePath}\\${appName}</Command>
      <Arguments>tasksch</Arguments>
    </Exec>
  </Actions>
</Task>
`

  return xml
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
        .map((v) => deleteConnection(v.id))
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

export const addToRuleSet = async (ruleset: 'direct' | 'reject' | 'block', payload: string) => {
  // TODO: sing-box json rule
  const path = `data/rulesets/${ruleset}.json`
  const content = (await ignoredError(Readfile, path)) || '{}'
  const { payload: p = [] } = JSON.parse(content)
  p.unshift(payload)
  await Writefile(path, JSON.stringify({ payload: [...new Set(p)] }))
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

  setTimeout(ExitApp, 3_000)

  try {
    await pluginsStore.onShutdownTrigger()
  } catch (error: any) {
    window.Plugins.message.error(error)
  }

  ExitApp()
}
