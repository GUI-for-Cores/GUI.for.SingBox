import { ref } from 'vue'
import { defineStore } from 'pinia'

import { deepClone } from '@/utils'

export type Menu = {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[]
}

export const useApp = defineStore('app', () => {
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

  /* Profiles Clipboard */
  const profilesClipboard = ref<any>()
  const setProfilesClipboard = (data: any) => {
    profilesClipboard.value = deepClone(data)
  }

  const getProfilesClipboard = () => {
    return deepClone(profilesClipboard.value)
  }

  const clearProfilesClipboard = () => {
    profilesClipboard.value = false
  }

  return {
    menuShow,
    menuPosition,
    menuList,
    tipsShow,
    tipsMessage,
    tipsPosition,
    profilesClipboard,
    setProfilesClipboard,
    getProfilesClipboard,
    clearProfilesClipboard
  }
})
