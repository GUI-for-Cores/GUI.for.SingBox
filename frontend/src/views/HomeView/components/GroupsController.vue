<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onActivated } from 'vue'

import { useMessage, usePrompt } from '@/hooks'
import { ignoredError, sleep, handleUseProxy } from '@/utils'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import { getGroupDelay, getProxyDelay } from '@/api/kernel'

const expandedSet = ref<Set<string>>(new Set())
const loadingSet = ref<Set<string>>(new Set())
const filterKeywordsMap = ref<Record<string, string>>({})

const loading = ref(false)

const { t } = useI18n()
const { message } = useMessage()
const { prompt } = usePrompt()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const groups = computed(() => {
  const { proxies } = kernelApiStore
  return Object.values(proxies)
    .filter((v) => ['Selector', 'URLTest', 'Direct'].includes(v.type) && v.name !== 'GLOBAL')
    .concat(proxies.GLOBAL || [])
    .map((group) => {
      const all = (group.all || [])
        .filter((proxy) => {
          const history = proxies[proxy].history || []
          const alive = history[history.length - 1]?.delay > 0
          const condition1 =
            appSettings.app.kernel.unAvailable ||
            ['direct', 'block'].includes(proxy) ||
            proxies[proxy].all ||
            alive
          const keywords = filterKeywordsMap.value[group.name]
          const condition2 = keywords ? new RegExp(keywords, 'i').test(proxy) : true
          return condition1 && condition2
        })
        .map((proxy) => {
          const history = proxies[proxy].history || []
          const delay = history[history.length - 1]?.delay || 0
          return { ...proxies[proxy], delay }
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

const handleFilter = async (group: string) => {
  const keywords =
    (await ignoredError(prompt<string>, 'Tips', filterKeywordsMap.value[group], {
      placeholder: 'keywords'
    })) || ''
  try {
    new RegExp(keywords, 'i')
  } catch {
    message.error('Incorrect regular expression')
    await handleFilter(group)
    return
  }
  filterKeywordsMap.value[group] = keywords
}

const expandAll = () => groups.value.forEach(({ name }) => expandedSet.value.add(name))

const collapseAll = () => expandedSet.value.clear()

const isExpanded = (group: string) => expandedSet.value.has(group)

const isLoading = (group: string) => loadingSet.value.has(group)

const isFiltered = (group: string) => filterKeywordsMap.value[group]

const handleGroupDelay = async (group: string) => {
  loadingSet.value.add(group)
  try {
    await getGroupDelay(
      group,
      appSettings.app.kernel.testUrl || 'https://www.gstatic.com/generate_204'
    )
    await kernelApiStore.refreshProviderProxies()
  } catch (error: any) {
    message.error(error)
  }
  loadingSet.value.delete(group)
}

const handleProxyDelay = async (proxy: string) => {
  try {
    const { delay } = await getProxyDelay(
      proxy,
      appSettings.app.kernel.testUrl || 'https://www.gstatic.com/generate_204'
    )
    const _proxy = kernelApiStore.proxies[proxy]
    _proxy.history.push({ delay })
  } catch (error: any) {
    message.error(error)
  }
}

const handleRefresh = async () => {
  loading.value = true
  await ignoredError(kernelApiStore.refreshConfig)
  await ignoredError(kernelApiStore.refreshProviderProxies)
  await sleep(500)
  loading.value = false
}

const handleChangeTestUrl = async () => {
  try {
    const url = await prompt<string>(
      'home.controller.delayUrl',
      appSettings.app.kernel.testUrl || 'https://www.gstatic.com/generate_204',
      {
        placeholder: 'https://www.gstatic.com/generate_204'
      }
    )
    appSettings.app.kernel.testUrl = url
    message.success('common.success')
  } catch (error: any) {
    message.info(error)
  }
}

const locateGroup = (group: any, chain: string) => {
  collapseAll()
  if (kernelApiStore.proxies[chain].all) {
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

onActivated(() => {
  kernelApiStore.refreshProviderProxies()
})
</script>

<template>
  <div class="groups" style="margin-top: 0">
    <div class="header">
      <Switch v-model="appSettings.app.kernel.autoClose">
        {{ t('home.controller.autoClose') }}
      </Switch>
      <Switch v-model="appSettings.app.kernel.unAvailable" class="ml-8">
        {{ t('home.controller.unAvailable') }}
      </Switch>
      <Switch v-model="appSettings.app.kernel.cardMode" class="ml-8">
        {{ t('home.controller.cardMode') }}
      </Switch>
      <Switch v-model="appSettings.app.kernel.sortByDelay" class="ml-8">
        {{ t('home.controller.sortBy') }}
      </Switch>
      <Button @click="handleChangeTestUrl" type="primary" size="small" class="ml-8">
        {{ t('home.controller.delay') }}
      </Button>
      <Button @click="expandAll" v-tips="'home.overview.expandAll'" type="text" class="ml-auto">
        <Icon icon="expand" />
      </Button>
      <Button @click="collapseAll" v-tips="'home.overview.collapseAll'" type="text">
        <Icon icon="collapse" />
      </Button>
      <Button
        @click="handleRefresh"
        v-tips="'home.overview.refresh'"
        :loading="loading"
        icon="refresh"
        type="text"
      />
    </div>
  </div>
  <div v-for="group in groups" :key="group.name" class="groups">
    <div class="header" @click="toggleExpanded(group.name)">
      <div class="group-info">
        <span class="group-name">{{ group.name }}</span>
        <span class="group-type">
          {{ group.type }}
          <!-- {{
            t(
              {
                [Outbound.Selector]: 'kernel.proxyGroups.type.Selector',
                [Outbound.Urltest]: 'kernel.proxyGroups.type.UrlTest',
                [Outbound.Direct]: 'kernel.proxyGroups.type.Fallback'
              }[group.type]!
            )
          }} -->
        </span>
        <span> :: </span>
        <template v-for="(chain, index) in group.chains" :key="chain">
          <span v-if="index !== 0" style="color: gray"> / </span>
          <Button @click.stop="locateGroup(group, chain)" type="text" size="small">
            {{ chain }}
          </Button>
        </template>
      </div>
      <div class="action">
        <Button
          @click.stop="handleFilter(group.name)"
          type="text"
          icon="filter"
          :icon-color="isFiltered(group.name) ? 'var(--primary-color)' : ''"
        />
        <Button
          @click.stop="handleGroupDelay(group.name)"
          v-tips="'home.overview.delayTest'"
          :loading="isLoading(group.name)"
          icon="speedTest"
          type="text"
        />
        <Button @click.stop="toggleExpanded(group.name)" type="text">
          <Icon
            :class="{ 'rotate-z': isExpanded(group.name) }"
            icon="arrowDown"
            class="action-expand"
          />
        </Button>
      </div>
    </div>
    <Transition name="expand">
      <div v-if="isExpanded(group.name)" class="body">
        <Empty v-if="group.all.length === 0" />
        <template v-else-if="appSettings.app.kernel.cardMode">
          <Card
            v-for="proxy in group.all"
            :title="proxy.name"
            :selected="proxy.name === group.now"
            :key="proxy.name"
            @click="useProxyWithCatchError(group, proxy)"
            class="proxy"
          >
            <Button
              @click.stop="handleProxyDelay(proxy.name)"
              :style="{ color: delayColor(proxy.delay) }"
              type="text"
              class="delay"
            >
              {{ proxy.delay && proxy.delay + 'ms' }}
            </Button>
            <div class="type">{{ proxy.type }} {{ proxy.udp ? ':: udp' : '' }}</div>
          </Card>
        </template>
        <template v-else>
          <div
            v-for="proxy in group.all"
            v-tips.fast="proxy.name"
            @click="useProxyWithCatchError(group, proxy)"
            :key="proxy.name"
            :style="{ background: delayColor(proxy.delay) }"
            :class="{ selected: proxy.name === group.now }"
            class="proxy-square"
          ></div>
        </template>
      </div>
    </Transition>
  </div>
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

.groups {
  margin: 8px;

  .header {
    position: sticky;
    z-index: 1;
    top: 0;
    display: flex;
    align-items: center;
    padding: 8px;
    background-color: var(--card-bg);
    border-radius: 8px;
    backdrop-filter: blur(2px);
    .group-info {
      font-size: 14px;
      display: flex;
      align-items: center;
      .group-name {
        font-weight: bold;
        font-size: 18px;
      }

      .group-type {
        margin: 0 8px;
      }
    }

    .action {
      margin-left: auto;

      .rotate-z {
        transform: rotateZ(0deg);
      }
      &-expand {
        transform: rotateZ(-90deg);
        transition: all 0.2s;
      }
    }
  }

  .body {
    display: flex;
    flex-wrap: wrap;
    margin-top: 4px;
    .proxy {
      cursor: pointer;
      width: calc(20% - 8px);
      margin: 4px 4px;
      .delay {
        height: 20px;
        margin-left: -4px;
        padding-left: 4px;
      }
      .type,
      .delay {
        font-size: 12px;
      }
    }

    .proxy-square {
      width: 12px;
      height: 12px;
      margin: 4px;
      border-radius: 4px;
    }

    .selected {
      border-radius: 12px;
      border: 2px solid var(--primary-color);
      box-shadow: 0 0 4px var(--secondary-color);
    }
  }
}
</style>
