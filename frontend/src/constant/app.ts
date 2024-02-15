export const ProfilesFilePath = 'data/profiles.yaml'

export const SubscribesFilePath = 'data/subscribes.yaml'

export const RulesetsFilePath = 'data/rulesets.yaml'

export const PluginsFilePath = 'data/plugins.yaml'

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
  Skyblue = 'skyblue'
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
  [Color.Skyblue]: {
    primary: 'skyblue',
    secondary: '#0ca4e2'
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
  OnUpdateRuleset = 'on::update::ruleset'
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
