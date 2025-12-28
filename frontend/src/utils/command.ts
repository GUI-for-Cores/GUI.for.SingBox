import { ExitApp, RestartApp, WindowReloadApp } from '@/bridge'
import { ColorOptions, ThemeOptions } from '@/constant/app'
import { ModeOptions } from '@/constant/kernel'
import { PluginTrigger, PluginTriggerEvent } from '@/enums/app'
import useI18n from '@/lang'
import {
  useAppSettingsStore,
  useAppStore,
  useEnvStore,
  useKernelApiStore,
  usePluginsStore,
  useRulesetsStore,
  useSubscribesStore,
} from '@/stores'
import { handleChangeMode, message } from '@/utils'

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
      cmd: 'Core',
      children: [
        {
          label: 'tray.startKernel',
          cmd: 'Start Core',
          handler: kernelStore.startCore,
        },
        {
          label: 'tray.stopKernel',
          cmd: 'Stop Core',
          handler: kernelStore.stopCore,
        },
        {
          label: 'tray.restartKernel',
          cmd: 'Restart Core',
          handler: kernelStore.restartCore,
        },
        {
          label: 'tray.enableTunMode',
          cmd: 'Enable Tun',
          handler: () => kernelStore.updateConfig('tun', { enable: true }),
        },
        {
          label: 'tray.disableTunMode',
          cmd: 'Disable Tun',
          handler: () => kernelStore.updateConfig('tun', { enable: false }),
        },
        {
          label: 'kernel.allow-lan',
          cmd: 'Allow Lan',
          handler: () => kernelStore.updateConfig('allow-lan', true),
        },
        {
          label: 'kernel.disallow-lan',
          cmd: 'Disallow Lan',
          handler: () => kernelStore.updateConfig('allow-lan', false),
        },
        {
          label: 'kernel.mode',
          cmd: 'Core Mode',
          children: ModeOptions.map((mode) => ({
            label: mode.label,
            cmd: mode.value,
            handler: () => handleChangeMode(mode.value),
          })),
        },
      ],
    },
    {
      label: 'tray.proxy',
      cmd: 'System Proxy',
      children: [
        {
          label: 'tray.setSystemProxy',
          cmd: 'Set System Proxy',
          handler: envStore.setSystemProxy,
        },
        {
          label: 'tray.clearSystemProxy',
          cmd: 'Clear System Proxy',
          handler: envStore.clearSystemProxy,
        },
      ],
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
              label: 'settings.lang.load',
              cmd: 'Load language files',
              handler: async () => {
                await appSettings.loadLocales()
                message.success('common.success')
              },
            },
            ...appSettings.locales.map((v) => ({
              label: v.label,
              cmd: v.value,
              handler: () => (appSettings.app.lang = v.value),
            })),
          ],
        },
        {
          label: 'settings.theme.name',
          cmd: 'Theme',
          children: ThemeOptions.map((theme) => ({
            label: theme.label,
            cmd: theme.value,
            handler: () => (appSettings.app.theme = theme.value),
          })),
        },
        {
          label: 'settings.color.name',
          cmd: 'Color',
          children: ColorOptions.map((color) => ({
            label: color.label,
            cmd: color.value,
            handler: () => (appSettings.app.color = color.value),
          })),
        },
        {
          label: 'titlebar.reload',
          cmd: 'Reload Window',
          handler: WindowReloadApp,
        },
        {
          label: 'tray.restartTip',
          cmd: 'Restart APP',
          handler: RestartApp,
        },
        {
          label: 'tray.exitTip',
          cmd: 'Exit APP',
          handler: ExitApp,
        },
        {
          label: 'router.about',
          cmd: 'About APP',
          handler: () => (appStore.showAbout = true),
        },
      ],
    },
    {
      label: 'router.subscriptions',
      cmd: 'Subscriptions',
      children: [
        {
          label: 'common.updateAll',
          cmd: 'Update Subscriptions',
          handler: subscriptionsStore.updateSubscribes,
        },
      ],
    },
    {
      label: 'router.rulesets',
      cmd: 'Rulesets',
      children: [
        {
          label: 'common.updateAll',
          cmd: 'Update Rulesets',
          handler: rulesetsStore.updateRulesets,
        },
      ],
    },
    {
      label: 'router.plugins',
      cmd: 'Plugins',
      children: [
        {
          label: 'common.updateAll',
          cmd: 'Update Plugins',
          handler: pluginsStore.updatePlugins,
        },
      ],
    },

    {
      label: 'tray.plugins',
      cmd: 'Plugins',
      children: pluginsStore.plugins.flatMap((plugin) => {
        const hasTrigger = !!plugin.triggers.find((trigger) => trigger === PluginTrigger.OnManual)
        const hasMenus = !!Object.keys(plugin.menus).length
        if (!hasTrigger && !hasMenus) return []
        const children: Command[] = []
        if (hasTrigger) {
          children.push({
            label: 'common.run',
            cmd: PluginTrigger.OnManual,
            handler: async () => {
              plugin.running = true
              try {
                await pluginsStore.manualTrigger(plugin.id, PluginTriggerEvent.OnManual)
              } catch (error: any) {
                message.error(error)
              }
              plugin.running = false
            },
          })
        }
        if (hasMenus) {
          Object.entries(plugin.menus).forEach(([title, fnName]) => {
            children.push({
              label: title,
              cmd: fnName,
              handler: async () => {
                try {
                  plugin.running = true
                  await pluginsStore.manualTrigger(plugin.id, fnName as any)
                } catch (error: any) {
                  message.error(error.message || error)
                } finally {
                  plugin.running = false
                }
              },
            })
          })
        }
        return { label: plugin.name, cmd: plugin.id, children }
      }),
    },
  ]

  return processCommands(rawCommands)
}
