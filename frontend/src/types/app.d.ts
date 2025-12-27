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
  RequestMethod,
} from '@/enums/app'

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
  lang: Lang | string
  theme: Theme
  color: Color
  primaryColor: string
  secondaryColor: string
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
  proxyBypassList: string
  autoStartKernel: boolean
  autoRestartKernel: boolean
  userAgent: string
  startupDelay: number
  connections: {
    visibility: Record<string, boolean>
    order: string[]
  }
  kernel: {
    realMemoryUsage: boolean
    branch: Branch
    profile: string
    autoClose: boolean
    unAvailable: boolean
    cardMode: boolean
    cardColumns: number
    sortByDelay: boolean
    testUrl: string
    concurrencyLimit: number
    controllerCloseMode: ControllerCloseMode
    controllerSensitivity: number
    main: {
      env: Recordable
      args: string[]
    }
    alpha: {
      env: Recordable
      args: string[]
    }
  }
  pluginSettings: Record<string, Record<string, any>>
  githubApiToken: string
  multipleInstance: boolean
  addPluginToMenu: boolean
  addGroupToMenu: boolean
  rollingRelease: boolean
  debugOutline: boolean
  debugNoAnimation: boolean
  debugNoRounded: false
  debugBorder: boolean
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
    | 'MultipleSelect'
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
  tags: string[]
  hasUI: boolean
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
  requestMethod: RequestMethod
  requestTimeout: number
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
