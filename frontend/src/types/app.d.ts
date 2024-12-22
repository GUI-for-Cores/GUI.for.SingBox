type TrayContent = {
  icon?: string
  title?: string
  tooltip?: string
}

type Menu = {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[]
}

type MenuItem = {
  type: 'item' | 'separator'
  text?: string
  tooltip?: string
  event?: (() => void) | string
  children?: MenuItem[]
  hidden?: boolean
  checked?: boolean
}
