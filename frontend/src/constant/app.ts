export const ProfilesFilePath = './data/profiles.yaml'

export const SubscribesFilePath = './data/subscribes.yaml'

export const NodeConverterFilePath = './data/nodeConverter.js'

export const RulesetsFilePath = './data/rulesets.yaml'

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
