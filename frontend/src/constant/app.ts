export const ProfilesFilePath = 'data/profiles.yaml'

export const SubscribesFilePath = 'data/subscribes.yaml'

export const RulesetsFilePath = 'data/rulesets.yaml'

export const PluginsFilePath = 'data/plugins.yaml'

export const ScheduledTasksFilePath = 'data/scheduledtasks.yaml'

export enum WindowStartState {
  Normal = 0,
  // Maximised = 1,
  Minimised = 2
  // Fullscreen = 3
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
  Green = 'green'
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
    secondary: '#f76363'
  },
  [Color.Skyblue]: {
    primary: 'skyblue',
    secondary: '#0ca4e2'
  },
  [Color.Green]: {
    primary: 'green',
    secondary: '#008000'
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
  OnShutdown = 'on::shutdown'
}

export enum PluginManualEvent {
  OnInstall = 'onInstall',
  OnUninstall = 'onUninstall',
  OnRun = 'onRun'
}

export const PluginsTriggerOptions = [
  { label: 'plugin.on::manual', value: PluginTrigger.OnManual },
  { label: 'plugin.on::subscribe', value: PluginTrigger.OnSubscribe },
  { label: 'plugin.on::generate', value: PluginTrigger.OnGenerate },
  { label: 'plugin.on::startup', value: PluginTrigger.OnStartup },
  { label: 'plugin.on::shutdown', value: PluginTrigger.OnShutdown }
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
