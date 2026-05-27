import { ref } from 'vue'

import { IsStartup } from '@/bridge'
import * as Stores from '@/stores'
import { message, sleep } from '@/utils'

const MIN_SPLASH_DURATION = 1000

export const useAppBootstrap = () => {
  const loading = ref(true)
  const percent = ref(0)
  const hasError = ref(false)

  const envStore = Stores.useEnvStore()
  const appSettings = Stores.useAppSettingsStore()
  const profilesStore = Stores.useProfilesStore()
  const subscribesStore = Stores.useSubscribesStore()
  const rulesetsStore = Stores.useRulesetsStore()
  const pluginsStore = Stores.usePluginsStore()
  const scheduledTasksStore = Stores.useScheduledTasksStore()
  const kernelApiStore = Stores.useKernelApiStore()

  const showError = (error: unknown) => {
    hasError.value = true
    message.error(error)
  }

  const initialize = async () => {
    await envStore.setupEnv()

    await Promise.all([
      appSettings.setupAppSettings(),
      profilesStore.setupProfiles(),
      subscribesStore.setupSubscribes(),
      rulesetsStore.setupRulesets(),
      pluginsStore.setupPlugins(),
      scheduledTasksStore.setupScheduledTasks(),
    ])

    const startTime = performance.now()
    percent.value = 20

    if (await IsStartup()) {
      await pluginsStore.onStartupTrigger().catch(showError)
    }

    percent.value = 40
    await pluginsStore.onReadyTrigger().catch(showError)

    const duration = performance.now() - startTime
    percent.value = duration < 500 ? 80 : 100

    await sleep(Math.max(0, MIN_SPLASH_DURATION - duration))

    loading.value = false
    kernelApiStore.initCoreState()
  }

  initialize().catch(showError)

  return {
    loading,
    percent,
    hasError,
  }
}
