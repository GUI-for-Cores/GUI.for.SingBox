import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Exec, FileExists } from '@/bridge'
import { GetEnv } from '@/bridge'

export const useSubconverterStore = defineStore('subconverter', () => {
  const SUBCONVERTER_URL = 'https://github.com/GUI-for-Cores/sing-box-subconverter-offline'
  const SUBCONVERTER_VERSION_API =
    'https://api.github.com/repos/GUI-for-Cores/sing-box-subconverter-offline/releases/latest'
  const SUBCONVERTER_VERSION = ref('None')
  const SUBCONVERTER_PATH = ref('')
  const SUBCONVERTER_EXISTS = ref(false)
  const SUBCONVERTER_DIR = ref('data/subconverter')
  const initialized = ref(false)

  const initSubconverter = async () => {
    const { os } = await GetEnv()
    const suffix = { windows: '.exe', linux: '', darwin: '' }[os]
    SUBCONVERTER_PATH.value = SUBCONVERTER_DIR.value + '/sing-box-subconverter' + suffix

    if (initialized.value) return
    if (await FileExists(SUBCONVERTER_PATH.value)) {
      if (initialized.value) return
      const version = await Exec(SUBCONVERTER_PATH.value, ['--version'])
      if (version) {
        SUBCONVERTER_VERSION.value = 'v' + version.trim()
      }

      SUBCONVERTER_EXISTS.value = true
    }
    initialized.value = true
  }

  initSubconverter()

  const ensureInitialized = async () => {
    if (!initialized.value) {
      await initSubconverter()
    }
  }

  return {
    SUBCONVERTER_URL,
    SUBCONVERTER_VERSION_API,
    SUBCONVERTER_VERSION,
    SUBCONVERTER_PATH,
    SUBCONVERTER_EXISTS,
    SUBCONVERTER_DIR,
    ensureInitialized
  }
})
