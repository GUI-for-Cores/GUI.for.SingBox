import {
  Color,
  ControllerCloseMode,
  PluginTrigger,
  RequestMethod,
  ScheduledTasksType,
  View,
} from '@/enums/app'

export const LocalesFilePath = 'data/locales'

export const UserFilePath = 'data/user.yaml'

export const ProfilesFilePath = 'data/profiles.yaml'

export const SubscribesFilePath = 'data/subscribes.yaml'

export const RulesetsFilePath = 'data/rulesets.yaml'

export const PluginsFilePath = 'data/plugins.yaml'

export const ScheduledTasksFilePath = 'data/scheduledtasks.yaml'

export const PluginHubFilePath = 'data/.cache/plugin-list.json'

export const RulesetHubFilePath = 'data/.cache/ruleset-list.json'

export const DefaultFontFamily =
  'system-ui, "Microsoft YaHei UI", "Source Han Sans CN", "Twemoji Mozilla", sans-serif'

export const Colors = {
  [Color.Default]: {
    primary: 'rgb(0, 89, 214)',
    secondary: 'rgb(5, 62, 142)',
  },
  [Color.Orange]: {
    primary: 'orange',
    secondary: '#ab7207',
  },
  [Color.Pink]: {
    primary: 'pink',
    secondary: '#f1768b',
  },
  [Color.Red]: {
    primary: 'red',
    secondary: '#9e0404',
  },
  [Color.Skyblue]: {
    primary: 'skyblue',
    secondary: '#0ca4e2',
  },
  [Color.Green]: {
    primary: 'green',
    secondary: '#025f02',
  },
  [Color.Purple]: {
    primary: 'purple',
    secondary: '#6a0f9c',
  },
}

export const ViewOptions = [
  { label: 'common.grid', value: View.Grid },
  { label: 'common.list', value: View.List },
]

export const ControllerCloseModeOptions = [
  { label: 'home.controller.closeMode.all', value: ControllerCloseMode.All },
  { label: 'home.controller.closeMode.button', value: ControllerCloseMode.Button },
]

export const RequestMethodOptions = [
  { label: RequestMethod.Get, value: RequestMethod.Get },
  { label: RequestMethod.Post, value: RequestMethod.Post },
  { label: RequestMethod.Delete, value: RequestMethod.Delete },
  { label: RequestMethod.Put, value: RequestMethod.Put },
  { label: RequestMethod.Head, value: RequestMethod.Head },
  { label: RequestMethod.Patch, value: RequestMethod.Patch },
]

// vue-draggable-plus config
export const DraggableOptions = {
  animation: 150,
}

export const PluginsTriggerOptions = [
  { label: 'plugin.on::startup', value: PluginTrigger.OnStartup },
  { label: 'plugin.on::ready', value: PluginTrigger.OnReady },
  { label: 'plugin.on::shutdown', value: PluginTrigger.OnShutdown },
  { label: 'plugin.on::manual', value: PluginTrigger.OnManual },
  { label: 'plugin.on::generate', value: PluginTrigger.OnGenerate },
  { label: 'plugin.on::subscribe', value: PluginTrigger.OnSubscribe },
  { label: 'plugin.on::tray::update', value: PluginTrigger.OnTrayUpdate },
  { label: 'plugin.on::before::core::start', value: PluginTrigger.OnBeforeCoreStart },
  { label: 'plugin.on::core::started', value: PluginTrigger.OnCoreStarted },
  { label: 'plugin.on::before::core::stop', value: PluginTrigger.OnBeforeCoreStop },
  { label: 'plugin.on::core::stopped', value: PluginTrigger.OnCoreStopped },
]

export const ScheduledTaskOptions = [
  { label: 'scheduledtask.update::subscription', value: ScheduledTasksType.UpdateSubscription },
  { label: 'scheduledtask.update::ruleset', value: ScheduledTasksType.UpdateRuleset },
  { label: 'scheduledtask.update::plugin', value: ScheduledTasksType.UpdatePlugin },
  { label: 'scheduledtask.run::plugin', value: ScheduledTasksType.RunPlugin },
  { label: 'scheduledtask.run::script', value: ScheduledTasksType.RunScript },
  {
    label: 'scheduledtask.update::all::subscription',
    value: ScheduledTasksType.UpdateAllSubscription,
  },
  { label: 'scheduledtask.update::all::ruleset', value: ScheduledTasksType.UpdateAllRuleset },
  { label: 'scheduledtask.update::all::plugin', value: ScheduledTasksType.UpdateAllPlugin },
]

export const DefaultSubscribeScript = `const onSubscribe = async (proxies, subscription) => {\n  return { proxies, subscription }\n}`

export const DefaultTestURL = 'https://www.gstatic.com/generate_204'

export const DefaultConcurrencyLimit = 20

export const DefaultCardColumns = 5

export const DefaultControllerSensitivity = 2
