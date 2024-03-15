<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { View } from '@/constant'
import { useMessage } from '@/hooks'
import { DraggableOptions } from '@/constant'
import { updateProvidersProxies } from '@/api/kernel'
import { BrowserOpenURL, Removefile } from '@/bridge'
import { formatBytes, formatRelativeTime, debounce, ignoredError } from '@/utils'
import {
  type SubscribeType,
  type Menu,
  useSubscribesStore,
  useAppSettingsStore,
  useKernelApiStore
} from '@/stores'

import ProxiesView from './components/ProxiesView.vue'
import SubscribeForm from './components/SubscribeForm.vue'

const showSubForm = ref(false)
const showProxies = ref(false)
const proxiesSub = ref()
const proxiesTitle = ref('')
const subFormSubID = ref()
const subFormIsUpdate = ref(false)
const subFormTitle = computed(() => (subFormIsUpdate.value ? 'common.edit' : 'common.add'))

const menuList: Menu[] = [
  {
    label: 'subscribes.editProxies',
    handler: (id: string) => handleEditProxies(id)
  }
]

const { t } = useI18n()
const { message } = useMessage()
const subscribeStore = useSubscribesStore()
const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const handleAddSub = async () => {
  subFormIsUpdate.value = false
  showSubForm.value = true
}

const handleUpdateSubs = async () => {
  try {
    await subscribeStore.updateSubscribes()
    await _updateAllProviderProxies()
    message.success('success')
  } catch (error: any) {
    console.error('updateSubscribes: ', error)
    message.error(error)
  }
}

const handleEditSub = (s: SubscribeType) => {
  subFormIsUpdate.value = true
  subFormSubID.value = s.id
  showSubForm.value = true
}

const handleEditProxies = (id: string) => {
  const sub = subscribeStore.getSubscribeById(id)
  if (sub) {
    proxiesTitle.value = sub.name
    proxiesSub.value = sub
    showProxies.value = true
  }
}

const handleUpdateSub = async (s: SubscribeType) => {
  try {
    await subscribeStore.updateSubscribe(s.id)
    await _updateProviderProxies(s.id)
  } catch (error: any) {
    console.error('updateSubscribe: ', error)
    message.error(error)
  }
}

const handleDeleteSub = async (s: SubscribeType) => {
  try {
    await ignoredError(Removefile, s.path)
    await subscribeStore.deleteSubscribe(s.id)
  } catch (error: any) {
    console.error('deleteSubscribe: ', error)
    message.error(error)
  }
}

const handleDisableSub = async (s: SubscribeType) => {
  s.disabled = !s.disabled
  subscribeStore.editSubscribe(s.id, s)
}

const onEditProxiesEnd = async () => {
  try {
    await _updateProviderProxies(proxiesSub.value.id)
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}

const _updateProviderProxies = async (provider: string) => {
  if (appSettingsStore.app.kernel.running) {
    await kernelApiStore.refreshProviderProxies()
    if (kernelApiStore.providers[provider]) {
      await updateProvidersProxies(provider)
      await kernelApiStore.refreshProviderProxies()
    }
  }
}

const _updateAllProviderProxies = async () => {
  if (appSettingsStore.app.kernel.running) {
    await kernelApiStore.refreshProviderProxies()
    const ids = Object.keys(kernelApiStore.providers).filter(
      (v) => v !== 'default' && !kernelApiStore.proxies[v]
    )
    for (let i = 0; i < ids.length; i++) {
      await updateProvidersProxies(ids[i])
    }
    if (ids.length !== 0) {
      await kernelApiStore.refreshProviderProxies()
    }
  }
}

const noUpdateNeeded = computed(() => subscribeStore.subscribes.every((v) => v.disabled))

const clacTrafficPercent = (s: any) => ((s.upload + s.download) / s.total) * 100

const clacTrafficStatus = (s: any) => (clacTrafficPercent(s) > 80 ? 'warning' : 'primary')

const onSortUpdate = debounce(subscribeStore.saveSubscribes, 1000)
</script>

<template>
  <div v-if="subscribeStore.subscribes.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="subscribes.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddSub" type="link">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio
      v-model="appSettingsStore.app.subscribesView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
      class="mr-auto"
    />
    <Button
      @click="handleUpdateSubs"
      :disable="noUpdateNeeded"
      :type="noUpdateNeeded ? 'text' : 'link'"
    >
      {{ t('common.updateAll') }}
    </Button>
    <Button @click="handleAddSub" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[subscribeStore.subscribes, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="'grid-list-' + appSettingsStore.app.subscribesView"
  >
    <Card
      v-for="s in subscribeStore.subscribes"
      :key="s.id"
      :title="s.name"
      :disabled="s.disabled"
      v-menu="menuList.map((v) => ({ ...v, handler: () => v.handler?.(s.id) }))"
      class="item"
    >
      <template #title-prefix>
        <Tag v-if="s.updating" color="cyan">
          {{ t('subscribe.updating') }}
        </Tag>
      </template>

      <template #title-suffix>
        <Icon
          v-if="s.type !== 'File' && s.website"
          v-tips="'subscribe.website'"
          icon="link"
          @click="BrowserOpenURL(s.website)"
          style="cursor: pointer"
        />
      </template>

      <template v-if="appSettingsStore.app.subscribesView === View.Grid" #extra>
        <Dropdown :trigger="['hover', 'click']">
          <Button type="link" size="small">
            {{ t('common.more') }}
          </Button>
          <template #overlay>
            <Button
              :disable="s.disabled"
              :loading="s.updating"
              :type="s.disabled ? 'text' : 'link'"
              size="small"
              @click="handleUpdateSub(s)"
            >
              {{ t('common.update') }}
            </Button>
            <Button type="link" size="small" @click="handleDisableSub(s)">
              {{ s.disabled ? t('common.enable') : t('common.disable') }}
            </Button>
            <Button type="link" size="small" @click="handleEditSub(s)">
              {{ t('common.edit') }}
            </Button>
            <Button type="link" size="small" @click="handleDeleteSub(s)">
              {{ t('common.delete') }}
            </Button>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button
          :disable="s.disabled"
          :loading="s.updating"
          :type="s.disabled ? 'text' : 'link'"
          size="small"
          @click="handleUpdateSub(s)"
        >
          {{ t('common.update') }}
        </Button>
        <Button type="link" size="small" @click="handleDisableSub(s)">
          {{ s.disabled ? t('common.enable') : t('common.disable') }}
        </Button>
        <Button type="link" size="small" @click="handleEditSub(s)">
          {{ t('common.edit') }}
        </Button>
        <Button type="link" size="small" @click="handleDeleteSub(s)">
          {{ t('common.delete') }}
        </Button>
      </template>
      <template v-if="appSettingsStore.app.subscribesView === View.List">
        <div style="margin-bottom: 8px">
          <Progress :percent="clacTrafficPercent(s)" :status="clacTrafficStatus(s)" />
        </div>
        <div>
          {{ t('subscribes.proxyCount') }}
          :
          <Button type="text" size="small" @click="handleEditProxies(s.id)">
            {{ s.proxies.length }}
          </Button>
        </div>
        <div>
          {{ t('subscribes.upload') }}
          :
          {{ s.upload ? formatBytes(s.upload) : '--' }}
          /
          {{ t('subscribes.download') }}
          :
          {{ s.download ? formatBytes(s.download) : '--' }}
          /
          {{ t('subscribes.total') }}
          :
          {{ s.total ? formatBytes(s.total) : '--' }}
        </div>
        <div>
          {{ t('subscribes.expire') }}
          :
          {{ s.expire || '--' }}
          /
          {{ t('common.updateTime') }}
          :
          {{ s.updateTime || '--' }}
        </div>
      </template>
      <template v-else>
        <div>
          {{ s.upload + s.download ? formatBytes(s.upload + s.download) : '--' }}
          /
          {{ s.total ? formatBytes(s.total) : '--' }}
        </div>
        <div class="traffic-diagram">
          <Progress
            :percent="clacTrafficPercent(s)"
            :status="clacTrafficStatus(s)"
            type="circle"
            :radius="20"
          />
        </div>
        <div>
          {{ t('subscribes.expire') }}
          :
          {{ s.expire ? formatRelativeTime(s.expire) : '--' }}
        </div>
        <div>
          {{ t('common.updateTime') }}
          :
          {{ s.updateTime ? formatRelativeTime(s.updateTime) : '--' }}
        </div>
      </template>
    </Card>
  </div>

  <Modal v-model:open="showSubForm" :title="subFormTitle" max-height="80" :footer="false">
    <SubscribeForm :is-update="subFormIsUpdate" :id="subFormSubID" />
  </Modal>

  <Modal
    v-model:open="showProxies"
    @ok="onEditProxiesEnd"
    :title="proxiesTitle"
    :footer="false"
    height="80"
    width="80"
  >
    <ProxiesView :sub="proxiesSub" />
  </Modal>
</template>

<style lang="less" scoped>
.traffic-diagram {
  position: absolute;
  top: 40px;
  right: 12px;
}
</style>
