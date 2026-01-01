<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { useI18n } from 'vue-i18n'

import { getProxyDelay } from '@/api/kernel'
import {
  ControllerCloseModeOptions,
  DefaultCardColumns,
  DefaultConcurrencyLimit,
  DefaultControllerSensitivity,
  DefaultTestURL,
} from '@/constant/app'
import { ControllerCloseMode } from '@/enums/app'
import { useBool } from '@/hooks'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import {
  ignoredError,
  sleep,
  handleUseProxy,
  message,
  createAsyncPool,
  buildSmartRegExp,
} from '@/utils'

const expandedSet = ref<Set<string>>(new Set())
const loadingSet = ref<Set<string>>(new Set())
const filterKeywordsMap = ref<Record<string, string>>({})

const loading = ref(false)

const { t } = useI18n()
const [showMoreSettings, toggleMoreSettings] = useBool(false)
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const groups = computed(() => {
  const { proxies } = kernelApiStore
  return Object.values(proxies)
    .filter((v) => ['Selector', 'URLTest'].includes(v.type) && v.name !== 'GLOBAL')
    .concat(proxies.GLOBAL || [])
    .map((group) => {
      const all = (group.all || [])
        .filter((proxy) => {
          const history = proxies[proxy]?.history || []
          const alive = (history[history.length - 1]?.delay ?? 0) > 0
          const condition1 =
            appSettings.app.kernel.unAvailable ||
            ['direct', 'block'].includes(proxy) ||
            proxies[proxy]?.all ||
            alive
          const keywords = filterKeywordsMap.value[group.name]
          const condition2 = keywords ? buildSmartRegExp(keywords, 'i').test(proxy) : true
          return condition1 && condition2
        })
        .map((proxy) => {
          const history = proxies[proxy]?.history || []
          const delay = history[history.length - 1]?.delay || 0
          return { ...proxies[proxy]!, delay }
        })
        .sort((a, b) => {
          if (!appSettings.app.kernel.sortByDelay || a.delay === b.delay) return 0
          if (!a.delay) return 1
          if (!b.delay) return -1
          return a.delay - b.delay
        })

      const chains = [group.now]
      let tmp = proxies[group.now]
      while (tmp) {
        tmp.now && chains.push(tmp.now)
        tmp = proxies[tmp.now]
      }
      return { ...group, all, chains }
    })
})

const useProxyWithCatchError = (group: any, proxy: any) => {
  handleUseProxy(group, proxy).catch((err: any) => message.error(err.message || err))
}

const toggleExpanded = (group: string) => {
  if (expandedSet.value.has(group)) {
    expandedSet.value.delete(group)
  } else {
    expandedSet.value.add(group)
  }
}

const expandAll = () => groups.value.forEach(({ name }) => expandedSet.value.add(name))

const collapseAll = () => expandedSet.value.clear()

const isExpanded = (group: string) => expandedSet.value.has(group)

const isLoading = (group: string) => loadingSet.value.has(group)

const isFiltered = (group: string) => filterKeywordsMap.value[group]

const handleGroupDelay = async (group: string) => {
  const _group = kernelApiStore.proxies[group]
  if (_group) {
    let index = 0
    let success = 0
    let failure = 0

    const delayTest = async (proxy: string) => {
      index += 1
      update(`Testing... ${index} / ${_group.all.length}, success: ${success} failure: ${failure}`)
      const _proxy = kernelApiStore.proxies[proxy]
      try {
        loadingSet.value.add(proxy)
        const { delay = 0 } = await getProxyDelay(
          encodeURIComponent(proxy),
          appSettings.app.kernel.testUrl || DefaultTestURL,
        )
        success += 1
        _proxy && _proxy.history.push({ delay })
      } catch {
        failure += 1
        _proxy && _proxy.history.push({ delay: 0 })
      }
      update(`Testing... ${index} / ${_group.all.length}, success: ${success} failure: ${failure}`)
      loadingSet.value.delete(proxy)
    }

    loadingSet.value.add(group)
    const { run, controller } = createAsyncPool(
      appSettings.app.kernel.concurrencyLimit || DefaultConcurrencyLimit,
      _group.all,
      delayTest,
    )
    const {
      update,
      destroy,
      success: msgSuccess,
    } = message.info('Testing...', 99999, () => {
      controller.cancel()
      message.warn('common.canceled')
    })
    await run()
    loadingSet.value.delete(group)
    msgSuccess(
      `Completed. ${index} / ${_group.all.length}, success: ${success} failure: ${failure}`,
    )
    await sleep(3000)
    destroy()
  }
}

const handleProxyDelay = async (proxy: string) => {
  loadingSet.value.add(proxy)
  try {
    const { delay = 0 } = await getProxyDelay(
      encodeURIComponent(proxy),
      appSettings.app.kernel.testUrl || DefaultTestURL,
    )
    const _proxy = kernelApiStore.proxies[proxy]
    _proxy && _proxy.history.push({ delay })
  } catch (error: any) {
    message.error(error + ': ' + proxy)
  }
  loadingSet.value.delete(proxy)
}

const handleRefresh = async () => {
  loading.value = true
  await ignoredError(kernelApiStore.refreshConfig)
  await ignoredError(kernelApiStore.refreshProviderProxies)
  await sleep(100)
  loading.value = false
}

const locateGroup = (group: any, chain: string) => {
  collapseAll()
  if (kernelApiStore.proxies[chain]?.all) {
    toggleExpanded(kernelApiStore.proxies[chain].name)
  } else {
    toggleExpanded(group.name)
  }
}

const delayColor = (delay = 0) => {
  if (delay === 0) return 'var(--level-0-color)'
  if (delay < 500) return 'var(--level-1-color)'
  if (delay < 1000) return 'var(--level-2-color)'
  if (delay < 1500) return 'var(--level-3-color)'
  return 'var(--level-4-color)'
}

const handleResetMoreSettings = () => {
  appSettings.app.kernel.testUrl = DefaultTestURL
  appSettings.app.kernel.concurrencyLimit = DefaultConcurrencyLimit
  appSettings.app.kernel.controllerCloseMode = ControllerCloseMode.All
  appSettings.app.kernel.controllerSensitivity = DefaultControllerSensitivity
  appSettings.app.kernel.cardColumns = DefaultCardColumns
  message.success('common.success')
}

onActivated(() => {
  kernelApiStore.refreshProviderProxies()
})
</script>

<template>
  <div class="m-8 mt-0 sticky top-0 z-3">
    <div
      class="sticky flex gap-8 items-center p-8 rounded-8 backdrop-blur-sm"
      style="background-color: var(--card-bg)"
    >
      <Switch v-model="appSettings.app.kernel.autoClose" label="home.controller.autoClose" />
      <Switch v-model="appSettings.app.kernel.unAvailable" label="home.controller.unAvailable" />
      <Switch v-model="appSettings.app.kernel.cardMode" label="home.controller.cardMode" />
      <Switch v-model="appSettings.app.kernel.sortByDelay" label="home.controller.sortBy" />
      <Button type="primary" size="small" @click="toggleMoreSettings"> ... </Button>
      <div class="ml-auto flex items-center">
        <Button v-tips="'home.overview.expandAll'" type="text" icon="expand" @click="expandAll" />
        <Button
          v-tips="'home.overview.collapseAll'"
          type="text"
          icon="collapse"
          @click="collapseAll"
        />
        <Button
          v-tips="'home.overview.refresh'"
          :loading="loading"
          icon="refresh"
          type="text"
          @click="handleRefresh"
        />
      </div>
    </div>
  </div>
  <div v-for="group in groups" :key="group.name" class="m-8">
    <div
      class="sticky z-2 flex gap-8 items-center p-8 rounded-8 backdrop-blur-sm"
      style="top: 52px; background-color: var(--card-bg)"
      @click="toggleExpanded(group.name)"
    >
      <div class="text-14 flex items-center gap-2 text-nowrap overflow-hidden">
        <span class="font-bold text-18">{{ group.name }}</span>
        <span class="mx-8">
          {{ group.type }}
        </span>
        <span> :: </span>
        <template v-for="(chain, index) in group.chains" :key="chain">
          <span v-if="index !== 0" style="color: gray"> / </span>
          <Button type="text" size="small" @click.stop="locateGroup(group, chain)">
            {{ chain }}
          </Button>
        </template>
      </div>
      <div class="ml-auto flex items-center" @click.stop>
        <Input
          v-model="filterKeywordsMap[group.name]"
          :placeholder="t('common.keywords')"
          editable
          clearable
        >
          <template #editable>
            <Button
              type="text"
              icon="filter"
              :icon-color="isFiltered(group.name) ? 'var(--primary-color)' : ''"
            />
          </template>
        </Input>
        <Button
          v-tips="'home.overview.delayTest'"
          :loading="isLoading(group.name)"
          icon="speedTest"
          type="text"
          @click="handleGroupDelay(group.name)"
        />
        <Button type="text" @click="toggleExpanded(group.name)">
          <Icon
            :class="{ 'action-expand-expanded': isExpanded(group.name) }"
            class="action-expand origin-center duration-200"
            icon="arrowDown"
          />
        </Button>
      </div>
    </div>
    <Transition name="expand">
      <div v-if="isExpanded(group.name)" class="py-8 px-4">
        <Empty v-if="group.all.length === 0" />
        <div
          v-else-if="appSettings.app.kernel.cardMode"
          :class="`grid-cols-${appSettings.app.kernel.cardColumns}`"
          class="grid gap-8"
        >
          <Card
            v-for="proxy in group.all"
            :key="proxy.name"
            :title="proxy.name"
            :selected="proxy.name === group.now"
            class="cursor-pointer"
            @click="useProxyWithCatchError(group, proxy)"
          >
            <Button
              :style="{ color: delayColor(proxy.delay) }"
              :loading="isLoading(proxy.name)"
              type="text"
              size="small"
              style="margin-left: -2px; padding-left: 2px"
              @click.stop="handleProxyDelay(proxy.name)"
            >
              <div class="text-12">
                {{ proxy.delay && proxy.delay + 'ms' }}
              </div>
            </Button>
            <div class="text-12 my-2">{{ proxy.type }} {{ proxy.udp ? ':: udp' : '' }}</div>
          </Card>
        </div>
        <div v-else class="grid grid-cols-32 gap-8">
          <div
            v-for="proxy in group.all"
            :key="proxy.name"
            v-tips.fast="proxy.name"
            :style="{ background: delayColor(proxy.delay) }"
            :class="proxy.name === group.now ? 'rounded-full shadow' : ''"
            class="w-12 h-12 rounded-4 flex items-center justify-center"
            @click="useProxyWithCatchError(group, proxy)"
          >
            <Icon v-if="isLoading(proxy.name)" icon="loading" :size="12" class="rotation" />
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <Modal
    v-model:open="showMoreSettings"
    :submit="false"
    mask-closable
    cancel-text="common.close"
    title="common.more"
  >
    <template #action>
      <Button type="text" class="mr-auto" @click="handleResetMoreSettings">
        {{ t('common.reset') }}
      </Button>
    </template>

    <div class="form-item">
      {{ t('home.controller.delay') }}
      <Input
        v-model="appSettings.app.kernel.testUrl"
        :placeholder="DefaultTestURL"
        editable
        clearable
      />
    </div>

    <div class="form-item">
      {{ t('home.controller.concurrencyLimit') }}
      <Input
        v-model="appSettings.app.kernel.concurrencyLimit"
        :min="1"
        :max="50"
        type="number"
        editable
        clearable
      />
    </div>

    <div class="form-item">
      {{ t('home.controller.closeMode.name') }}
      <Radio
        v-model="appSettings.app.kernel.controllerCloseMode"
        :options="ControllerCloseModeOptions"
      />
    </div>

    <div
      v-if="appSettings.app.kernel.controllerCloseMode === ControllerCloseMode.All"
      class="form-item"
    >
      {{ t('home.controller.sensitivity') }}
      <Input
        v-model="appSettings.app.kernel.controllerSensitivity"
        type="number"
        :min="1"
        :max="6"
        placeholder="1-6"
        editable
      />
    </div>

    <div class="form-item">
      {{ t('home.controller.cardColumns') }}
      <Radio
        v-model="appSettings.app.kernel.cardColumns"
        :options="Array.from({ length: 5 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))"
      />
    </div>
  </Modal>
</template>

<style lang="less" scoped>
.expand-enter-active,
.expand-leave-active {
  transform-origin: top;
  transition:
    transform 0.2s ease-in-out,
    opacity 0.2s ease-in-out;
}

.expand-enter-from,
.expand-leave-to {
  transform: scaleY(0);
}

.action-expand {
  transform: rotate(-90deg);
  &-expanded {
    transform: rotate(0deg);
  }
}
</style>
