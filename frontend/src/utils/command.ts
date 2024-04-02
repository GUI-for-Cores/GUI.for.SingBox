import useI18n from '@/lang'
import { Color, Lang, Theme } from '@/constant'
import { handleChangeMode } from '@/utils'
import { ExitApp, RestartApp, WindowReloadApp } from '@/bridge'
import {
  useAppSettingsStore,
  useAppStore,
  useEnvStore,
  useKernelApiStore,
  usePluginsStore,
  useRulesetsStore,
  useSubscribesStore
} from '@/stores'

type Command = {
  label: string
  cmd: string
  desc?: string
  handler?: () => Promise<any> | any
  children?: Command[]
}

const processCommands = (commands: Command[], parentLabel = '', parentCmd = '') => {
  const { t } = useI18n.global

  const result: Command[] = []

  commands.forEach((item) => {
    const label = parentLabel ? `${t(parentLabel)}: ${t(item.label)}` : t(item.label)
    const cmd = parentCmd ? `${parentCmd}: ${item.cmd}` : item.cmd

    if (item.children) {
      result.push(...processCommands(item.children, label, cmd))
    } else {
      result.push({ label, cmd, handler: item.handler })
    }
  })

  return result
}

export const getCommands = () => {
  const kernelStore = useKernelApiStore()
  const appSettings = useAppSettingsStore()
  const envStore = useEnvStore()
  const appStore = useAppStore()
  const subscriptionsStore = useSubscribesStore()
  const rulesetsStore = useRulesetsStore()
  const pluginsStore = usePluginsStore()

  const rawCommands: Command[] = [
    {
      label: 'tray.kernel',
      cmd: 'Kernel',
      children: [
        {
          label: 'tray.startKernel',
          cmd: 'Start Kernel',
          handler: kernelStore.startKernel
        },
        {
          label: 'tray.stopKernel',
          cmd: 'Stop Kernel',
          handler: kernelStore.stopKernel
        },
        {
          label: 'tray.restartKernel',
          cmd: 'Restart Kernel',
          handler: kernelStore.restartKernel
        },
        {
          label: 'tray.enableTunMode',
          cmd: 'Enable Tun',
          handler: async () => {
            await envStore.clearSystemProxy()
            await kernelStore.updateConfig('tun', true)
          }
        },
        {
          label: 'tray.disableTunMode',
          cmd: 'Disable Tun',
          handler: () => kernelStore.updateConfig('tun', false)
        },
        {
          label: 'kernel.allow-lan',
          cmd: 'Allow Lan',
          handler: () => kernelStore.updateConfig('allow-lan', true)
        },
        {
          label: 'kernel.disallow-lan',
          cmd: 'Disallow Lan',
          handler: () => kernelStore.updateConfig('allow-lan', false)
        },
        {
          label: 'kernel.mode',
          cmd: 'Kernel Mode',
          children: [
            {
              label: 'kernel.global',
              cmd: 'Global',
              handler: () => handleChangeMode('global')
            },
            {
              label: 'kernel.rule',
              cmd: 'Rule',
              handler: () => handleChangeMode('rule')
            },
            {
              label: 'kernel.direct',
              cmd: 'Direct',
              handler: () => handleChangeMode('direct')
            }
          ]
        }
      ]
    },
    {
      label: 'tray.proxy',
      cmd: 'System Proxy',
      children: [
        {
          label: 'tray.setSystemProxy',
          cmd: 'Set System Proxy',
          handler: async () => {
            await kernelStore.updateConfig('tun', false)
            await envStore.setSystemProxy()
          }
        },
        {
          label: 'tray.clearSystemProxy',
          cmd: 'Clear System Proxy',
          handler: envStore.clearSystemProxy
        }
      ]
    },
    {
      label: 'APP',
      cmd: 'APP',
      children: [
        {
          label: 'settings.lang.name',
          cmd: 'Language',
          children: [
            {
              label: 'settings.lang.zh',
              cmd: 'Chinese',
              handler: () => (appSettings.app.lang = Lang.ZH)
            },
            {
              label: 'settings.lang.en',
              cmd: 'English',
              handler: () => (appSettings.app.lang = Lang.EN)
            }
          ]
        },
        {
          label: 'settings.theme.name',
          cmd: 'Theme',
          children: [
            {
              label: 'settings.theme.light',
              cmd: 'Light',
              handler: () => (appSettings.app.theme = Theme.Light)
            },
            {
              label: 'settings.theme.dark',
              cmd: 'Dark',
              handler: () => (appSettings.app.theme = Theme.Dark)
            },
            {
              label: 'settings.theme.auto',
              cmd: 'Auto',
              handler: () => (appSettings.app.theme = Theme.Auto)
            }
          ]
        },
        {
          label: 'settings.color.name',
          cmd: 'Color',
          children: [
            {
              label: 'settings.color.default',
              cmd: 'Default',
              handler: () => (appSettings.app.color = Color.Default)
            },
            {
              label: 'settings.color.orange',
              cmd: 'Orange',
              handler: () => (appSettings.app.color = Color.Orange)
            },
            {
              label: 'settings.color.pink',
              cmd: 'Pink',
              handler: () => (appSettings.app.color = Color.Pink)
            },
            {
              label: 'settings.color.red',
              cmd: 'Red',
              handler: () => (appSettings.app.color = Color.Red)
            },
            {
              label: 'settings.color.skyblue',
              cmd: 'Skyblue',
              handler: () => (appSettings.app.color = Color.Skyblue)
            },
            {
              label: 'settings.color.green',
              cmd: 'Green',
              handler: () => (appSettings.app.color = Color.Green)
            }
          ]
        },
        {
          label: 'titlebar.reload',
          cmd: 'Reload Window',
          handler: WindowReloadApp
        },
        {
          label: 'tray.restartTip',
          cmd: 'Restart APP',
          handler: RestartApp
        },
        {
          label: 'tray.exitTip',
          cmd: 'Exit APP',
          handler: ExitApp
        },
        {
          label: 'router.about',
          cmd: 'About APP',
          handler: () => (appStore.showAbout = true)
        }
      ]
    },
    {
      label: 'router.subscriptions',
      cmd: 'Subscriptions',
      children: [
        {
          label: 'common.updateAll',
          cmd: 'Update Subscriptions',
          handler: subscriptionsStore.updateSubscribes
        }
      ]
    },
    {
      label: 'router.rulesets',
      cmd: 'Rulesets',
      children: [
        {
          label: 'common.updateAll',
          cmd: 'Update Rulesets',
          handler: rulesetsStore.updateRulesets
        }
      ]
    },
    {
      label: 'router.plugins',
      cmd: 'Plugins',
      children: [
        {
          label: 'common.updateAll',
          cmd: 'Update Plugins',
          handler: pluginsStore.updatePlugins
        }
      ]
    }
  ]

  return processCommands(rawCommands)
}
