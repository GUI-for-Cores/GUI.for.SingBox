<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { ProxyGroupType } from '@/constant'
import { ignoredError, sleep } from '@/utils'
import { useAppSettingsStore, useKernelApiStore } from '@/stores'
import {
  useProxy,
  getGroupDelay,
  getConnections,
  deleteConnection,
  getProxyDelay
} from '@/api/kernel'

const expandedSet = ref<Set<string>>(new Set())
const loadingSet = ref<Set<string>>(new Set())
const loading = ref(false)

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const groups = computed(() => {
  const { proxies } = kernelApiStore

  let fallback = -1
  let idx = 0

  let result = Object.values(proxies)
    .filter((v) => v.all)
    .map((provider) => {
      const all = provider.all
        .filter((v) => {
          if (
            appSettings.app.kernel.unAvailable ||
            ['direct', 'block'].includes(v) ||
            proxies[v].all
          ) {
            return true
          }
          const history = proxies[v].history || []
          return history && history[history.length - 1]?.delay > 0
        })
        .map((v) => {
          const history = proxies[v].history || []
          const delay = history[history.length - 1]?.delay
          return { ...proxies[v], delay }
        })

      const chains = [provider.now]
      let tmp = proxies[provider.now]
      while (tmp) {
        tmp.now && chains.push(tmp.now)
        tmp = proxies[tmp.now]
      }
      if (['GLOBAL', 'Fallback'].includes(provider.name)) {
        provider.name = 'Fallback'
        fallback = idx
      }
      ++idx
      return { ...provider, all, chains }
    })
  if (fallback >= 0) {
    result.push(result[fallback])
    result.splice(fallback, 1)
  }
  return result
})

const handleUseProxy = async (group: any, proxy: any) => {
  if (group.type !== 'Selector') return

  if (group.now === proxy.name) return

  const promises: Promise<null>[] = []

  if (appSettings.app.kernel.autoClose) {
    const { connections } = await getConnections()
    promises.push(
      ...(connections || [])
        .filter((v) => v.chains.includes(group.name))
        .map((v) => deleteConnection(v.id))
    )
  }

  try {
    await useProxy(group.name, proxy.name)
    await Promise.all(promises)
    await kernelApiStore.refreshProviderProxies()
  } catch (error: any) {
    message.info(error)
  }
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

const handleGroupDelay = async (group: string) => {
  loadingSet.value.add(group)
  try {
    await getGroupDelay(group)
    await kernelApiStore.refreshProviderProxies()
  } catch (error: any) {
    message.info(error)
  }
  loadingSet.value.delete(group)
}

const handleProxyDelay = async (proxy: string) => {
  try {
    const { delay } = await getProxyDelay(proxy)
    const _proxy = kernelApiStore.proxies[proxy]
    _proxy.history[_proxy.history.length - 1].delay = delay
  } catch (error: any) {
    message.info(error)
  }
}

const handleRefresh = async () => {
  loading.value = true
  await ignoredError(kernelApiStore.refreshConfig)
  await ignoredError(kernelApiStore.refreshProviderProxies)
  await sleep(500)
  loading.value = false
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
</script>

<template>
  <div class="groups" style="margin-top: 0">
    <div class="header">
      <Switch v-model="appSettings.app.kernel.autoClose">
        {{ t('home.controller.autoClose') }}
      </Switch>
      <Switch v-model="appSettings.app.kernel.unAvailable" style="margin-left: 8px">
        {{ t('home.controller.unAvailable') }}
      </Switch>
      <Switch v-model="appSettings.app.kernel.cardMode" style="margin-left: 8px">
        {{ t('home.controller.cardMode') }}
      </Switch>
      <Button
        @click="expandAll"
        v-tips="'home.overview.expandAll'"
        type="text"
        style="margin-left: auto"
      >
        <Icon icon="expand" />
      </Button>
      <Button @click="collapseAll" v-tips="'home.overview.collapseAll'" type="text">
        <Icon icon="collapse" />
      </Button>
      <Button
        @click="handleRefresh"
        v-tips="'home.overview.refresh'"
        :loading="loading"
        type="text"
      >
        <Icon icon="refresh" />
      </Button>
    </div>
  </div>
  <div v-for="group in groups" :key="group.name" class="groups">
    <div class="header">
      <div class="group-info">
        <span class="group-name">{{ group.name }}</span>
        <span class="group-type">
          {{
            t(
              {
                [ProxyGroupType.Selector]: 'kernel.proxyGroups.type.Selector',
                [ProxyGroupType.UrlTest]: 'kernel.proxyGroups.type.UrlTest',
                [ProxyGroupType.Fallback]: 'kernel.proxyGroups.type.Fallback'
              }[group.type]!
            )
          }}
        </span>
        <span> :: </span>
        <template v-for="(chain, index) in group.chains" :key="chain">
          <span v-if="index !== 0" style="color: gray"> / </span>
          <Button @click="locateGroup(group, chain)" type="text" size="small">{{ chain }}</Button>
        </template>
      </div>
      <div class="action">
        <Button
          @click="handleGroupDelay(group.name)"
          v-tips="'home.overview.delayTest'"
          :loading="isLoading(group.name)"
          type="text"
        >
          <Icon icon="speedTest" />
        </Button>
        <Button @click="toggleExpanded(group.name)" type="text">
          <Icon
            :class="{ 'rotate-z': isExpanded(group.name) }"
            icon="arrowDown"
            class="action-expand"
          />
        </Button>
      </div>
    </div>
    <div v-show="isExpanded(group.name)" class="body">
      <template v-if="appSettings.app.kernel.cardMode">
        <Card
          v-for="proxy in group.all"
          :title="proxy.name"
          :selected="proxy.name === group.now"
          :key="proxy.name"
          @click="handleUseProxy(group, proxy)"
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
          @click="handleUseProxy(group, proxy)"
          :key="proxy.name"
          :style="{ background: delayColor(proxy.delay) }"
          :class="{ selected: proxy.name === group.now }"
          class="proxy-square"
        ></div>
      </template>
    </div>
  </div>
</template>

<style lang="less" scoped>
.groups {
  margin: 8px;

  .header {
    position: sticky;
    z-index: 99;
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
