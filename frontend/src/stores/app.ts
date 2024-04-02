import { ref } from 'vue'
import { defineStore } from 'pinia'

export type Menu = {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[]
}

export const useAppStore = defineStore('app', () => {
  /* Global Menu */
  const menuShow = ref(false)
  const menuList = ref<Menu[]>([])
  const menuPosition = ref({
    x: 0,
    y: 0
  })

  /* Global Tips */
  const tipsShow = ref(false)
  const tipsMessage = ref('')
  const tipsPosition = ref({
    x: 0,
    y: 0
  })

  const showAbout = ref(false)

  return {
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    showAbout
  }
})
