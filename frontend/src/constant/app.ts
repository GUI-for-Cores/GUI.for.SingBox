export const ProfilesFilePath = 'data/profiles.yaml'

export const SubscribesFilePath = 'data/subscribes.yaml'

export const RulesetsFilePath = 'data/rulesets.yaml'

export const PluginsFilePath = 'data/plugins.yaml'

export const ScheduledTasksFilePath = 'data/scheduledtasks.yaml'

export const DefaultFontFamily =
  'system-ui, "Microsoft YaHei UI", "Source Han Sans CN", "Twemoji Mozilla", sans-serif'

export enum WindowStartState {
  Normal = 0,
  Minimised = 2
}

export enum WebviewGpuPolicy {
  Always = 0,
  OnDemand = 1,
  Never = 2
}

export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark'
}

export enum Lang {
  EN = 'en',
  ZH = 'zh'
}

export enum View {
  Grid = 'grid',
  List = 'list'
}

export enum Color {
  Default = 'default',
  Orange = 'orange',
  Pink = 'pink',
  Red = 'red',
  Skyblue = 'skyblue',
  Green = 'green',
  Purple = 'purple'
}

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

// vue-draggable-plus config
export const DraggableOptions = {
  animation: 150
}

export enum PluginTrigger {
  OnManual = 'on::manual',
  OnSubscribe = 'on::subscribe',
  OnGenerate = 'on::generate',
  OnStartup = 'on::startup',
  OnShutdown = 'on::shutdown',
  OnReady = 'on::ready'
}

export enum PluginTriggerEvent {
  OnInstall = 'onInstall',
  OnUninstall = 'onUninstall',
  OnManual = 'onRun',
  OnSubscribe = 'onSubscribe',
  OnGenerate = 'onGenerate',
  OnStartup = 'onStartup',
  OnShutdown = 'onShutdown',
  OnReady = 'onReady',
  OnTask = 'onTask',
  OnConfigure = 'onConfigure'
}

export const PluginsTriggerOptions = [
  { label: 'plugin.on::manual', value: PluginTrigger.OnManual },
  { label: 'plugin.on::subscribe', value: PluginTrigger.OnSubscribe },
  { label: 'plugin.on::generate', value: PluginTrigger.OnGenerate },
  { label: 'plugin.on::startup', value: PluginTrigger.OnStartup },
  { label: 'plugin.on::shutdown', value: PluginTrigger.OnShutdown },
  { label: 'plugin.on::ready', value: PluginTrigger.OnReady }
]

export type MenuItem = {
  type: 'item' | 'separator'
  text?: string
  tooltip?: string
  event?: (() => void) | string
  children?: MenuItem[]
  hidden?: boolean
  checked?: boolean
}

export type TrayContent = {
  icon?: string
  title?: string
  tooltip?: string
}

export enum ScheduledTasksType {
  UpdateSubscription = 'update::subscription',
  UpdateRuleset = 'update::ruleset',
  UpdatePlugin = 'update::plugin',
  RunPlugin = 'run::plugin',
  RunScript = 'run::script'
}

export const ScheduledTaskOptions = [
  { label: 'scheduledtask.update::subscription', value: ScheduledTasksType.UpdateSubscription },
  { label: 'scheduledtask.update::ruleset', value: ScheduledTasksType.UpdateRuleset },
  { label: 'scheduledtask.update::plugin', value: ScheduledTasksType.UpdatePlugin },
  { label: 'scheduledtask.run::plugin', value: ScheduledTasksType.RunPlugin },
  { label: 'scheduledtask.run::script', value: ScheduledTasksType.RunScript }
]
