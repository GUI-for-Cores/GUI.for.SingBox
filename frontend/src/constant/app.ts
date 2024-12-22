import { Color, PluginTrigger, ScheduledTasksType, View } from '@/enums/app'

export const ProfilesFilePath = 'data/profiles.yaml'

export const SubscribesFilePath = 'data/subscribes.yaml'

export const RulesetsFilePath = 'data/rulesets.yaml'

export const PluginsFilePath = 'data/plugins.yaml'

export const ScheduledTasksFilePath = 'data/scheduledtasks.yaml'

export const DefaultFontFamily =
  'system-ui, "Microsoft YaHei UI", "Source Han Sans CN", "Twemoji Mozilla", sans-serif'

export const Colors = {
  [Color.Default]: {
    primary: 'rgb(0, 89, 214)',
    secondary: 'rgb(5, 62, 142)'
  },
  [Color.Orange]: {
    primary: 'orange',
    secondary: '#ab7207'
  },
  [Color.Pink]: {
    primary: 'pink',
    secondary: '#f1768b'
  },
  [Color.Red]: {
    primary: 'red',
    secondary: '#9e0404'
  },
  [Color.Skyblue]: {
    primary: 'skyblue',
    secondary: '#0ca4e2'
  },
  [Color.Green]: {
    primary: 'green',
    secondary: '#025f02'
  },
  [Color.Purple]: {
    primary: 'purple',
    secondary: '#6a0f9c'
  }
}

export const ViewOptions = [
  { label: 'common.grid', value: View.Grid },
  { label: 'common.list', value: View.List }
]

// vue-draggable-plus config
export const DraggableOptions = {
  animation: 150
}

export const PluginsTriggerOptions = [
  { label: 'plugin.on::manual', value: PluginTrigger.OnManual },
  { label: 'plugin.on::subscribe', value: PluginTrigger.OnSubscribe },
  { label: 'plugin.on::generate', value: PluginTrigger.OnGenerate },
  { label: 'plugin.on::startup', value: PluginTrigger.OnStartup },
  { label: 'plugin.on::shutdown', value: PluginTrigger.OnShutdown },
  { label: 'plugin.on::ready', value: PluginTrigger.OnReady }
]

export const ScheduledTaskOptions = [
  { label: 'scheduledtask.update::subscription', value: ScheduledTasksType.UpdateSubscription },
  { label: 'scheduledtask.update::ruleset', value: ScheduledTasksType.UpdateRuleset },
  { label: 'scheduledtask.update::plugin', value: ScheduledTasksType.UpdatePlugin },
  { label: 'scheduledtask.run::plugin', value: ScheduledTasksType.RunPlugin },
  { label: 'scheduledtask.run::script', value: ScheduledTasksType.RunScript }
]
