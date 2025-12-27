export enum WindowStartState {
  Normal = 0,
  Minimised = 2,
}

export enum WebviewGpuPolicy {
  Always = 0,
  OnDemand = 1,
  Never = 2,
}

export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export enum Lang {
  EN = 'en',
  ZH = 'zh',
}

export enum View {
  Grid = 'grid',
  List = 'list',
}

export enum ControllerCloseMode {
  All = 'all',
  Button = 'button',
}

export enum Color {
  Default = 'default',
  Green = 'green',
  Purple = 'purple',
  Custom = 'custom',
}

export enum Branch {
  Main = 'main',
  Alpha = 'alpha',
}

export enum ScheduledTasksType {
  UpdateSubscription = 'update::subscription',
  UpdateRuleset = 'update::ruleset',
  UpdatePlugin = 'update::plugin',
  UpdateAllSubscription = 'update::all::subscription',
  UpdateAllRuleset = 'update::all::ruleset',
  UpdateAllPlugin = 'update::all::plugin',
  RunPlugin = 'run::plugin',
  RunScript = 'run::script',
}

export enum PluginTrigger {
  OnManual = 'on::manual',
  OnSubscribe = 'on::subscribe',
  OnGenerate = 'on::generate',
  OnStartup = 'on::startup',
  OnShutdown = 'on::shutdown',
  OnReady = 'on::ready',
  OnCoreStarted = 'on::core::started',
  OnCoreStopped = 'on::core::stopped',
  OnBeforeCoreStart = 'on::before::core::start',
  OnBeforeCoreStop = 'on::before::core::stop',
  OnTrayUpdate = 'on::tray::update',
}

export enum PluginTriggerEvent {
  OnInstall = 'onInstall',
  OnUninstall = 'onUninstall',
  OnManual = 'onRun',
  OnTrayUpdate = 'onTrayUpdate',
  OnSubscribe = 'onSubscribe',
  OnGenerate = 'onGenerate',
  OnStartup = 'onStartup',
  OnShutdown = 'onShutdown',
  OnReady = 'onReady',
  OnTask = 'onTask',
  OnConfigure = 'onConfigure',
  OnCoreStarted = 'onCoreStarted',
  OnCoreStopped = 'onCoreStopped',
  OnBeforeCoreStart = 'onBeforeCoreStart',
  OnBeforeCoreStop = 'onBeforeCoreStop',
}

export enum RequestMethod {
  Get = 'GET',
  Post = 'POST',
  Delete = 'DELETE',
  Put = 'PUT',
  Head = 'HEAD',
  Patch = 'PATCH',
}
