import { h, ref, type VNode } from 'vue'

import type {
  Lang,
  Theme,
  Color,
  View,
  WindowStartState,
  WebviewGpuPolicy,
  Branch,
  ControllerCloseMode,
  PluginTrigger,
  ScheduledTasksType,
} from '@/enums/app'

export {}

export interface TrayContent {
  icon?: string
  title?: string
  tooltip?: string
}

export interface Menu {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[]
}

export interface MenuItem {
  type: 'item' | 'separator'
  text?: string
  tooltip?: string
  event?: (() => void) | string
  children?: MenuItem[]
  hidden?: boolean
  checked?: boolean
}

export interface AppSettings {
  lang: Lang
  theme: Theme
  color: Color
  fontFamily: string
  profilesView: View
  subscribesView: View
  rulesetsView: View
  pluginsView: View
  scheduledtasksView: View
  windowStartState: WindowStartState
  webviewGpuPolicy: WebviewGpuPolicy
  width: number
  height: number
  exitOnClose: boolean
  closeKernelOnExit: boolean
  autoSetSystemProxy: boolean
  autoStartKernel: boolean
  userAgent: string
  startupDelay: number
  connections: {
    visibility: Record<string, boolean>
    order: string[]
  }
  kernel: {
    branch: Branch
    profile: string
    pid: number
    running: boolean
    autoClose: boolean
    unAvailable: boolean
    cardMode: boolean
    sortByDelay: boolean
    testUrl: string
    controllerCloseMode: ControllerCloseMode
  }
  pluginSettings: Record<string, Record<string, any>>
  githubApiToken: string
  multipleInstance: boolean
  addPluginToMenu: boolean
  addGroupToMenu: boolean
  rollingRelease: boolean
  pages: string[]
}

export interface PluginConfiguration {
  id: string
  title: string
  description: string
  key: string
  component:
    | 'CheckBox'
    | 'CodeViewer'
    | 'Input'
    | 'InputList'
    | 'KeyValueEditor'
    | 'Radio'
    | 'Select'
    | 'Switch'
    | ''
  value: any
  options: any[]
}

export interface Plugin {
  id: string
  version: string
  name: string
  description: string
  type: 'Http' | 'File'
  url: string
  path: string
  triggers: PluginTrigger[]
  menus: Record<string, string>
  context: {
    profiles: Recordable
    subscriptions: Recordable
    rulesets: Recordable
    plugins: Recordable
    scheduledtasks: Recordable
  }
  configuration: PluginConfiguration[]
  disabled: boolean
  install: boolean
  installed: boolean
  status: number // 0: Normal 1: Running 2: Stopped
  // Not Config
  updating?: boolean
  loading?: boolean
  running?: boolean
}

export interface ScheduledTask {
  id: string
  name: string
  type: ScheduledTasksType
  subscriptions: string[]
  rulesets: string[]
  plugins: string[]
  script: string
  cron: string
  notification: boolean
  disabled: boolean
  lastTime: number
}

export interface Subscription {
  id: string
  name: string
  upload: number
  download: number
  total: number
  expire: number
  updateTime: number
  type: 'Http' | 'File' | 'Manual'
  url: string
  website: string
  path: string
  include: string
  exclude: string
  includeProtocol: string
  excludeProtocol: string
  proxyPrefix: string
  disabled: boolean
  inSecure: boolean
  proxies: { id: string; tag: string; type: string }[]
  header: {
    request: Recordable
    response: Recordable
  }
  script: string
  // Not Config
  updating?: boolean
}

// Custom Action
export interface CustomActionApi {
  h: typeof h
  ref: typeof ref
}
type CustomActionProps = Recordable
type CustomActionSlots = Recordable<
  ((api: CustomActionApi) => VNode | string | number | boolean) | VNode | string | number | boolean
>
export interface CustomAction<P = CustomActionProps, S = CustomActionSlots> {
  id?: string
  component: string
  componentProps?: P | ((api: CustomActionApi) => P)
  componentSlots?: S | ((api: CustomActionApi) => S)
}
export type CustomActionFn = ((api: CustomActionApi) => CustomAction) & {
  id?: string
}
