<script setup lang="ts">
import { ref, watch, useTemplateRef, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { APP_TITLE, debounce, message } from '@/utils'
import { useAppSettingsStore, useProfilesStore, useKernelApiStore } from '@/stores'

import { useModal } from '@/components/Modal'
import QuickStart from './components/QuickStart.vue'
import OverView from './components/OverView.vue'
import KernelLogs from './components/KernelLogs.vue'
import GroupsController from './components/GroupsController.vue'

const showController = ref(false)
const controllerRef = useTemplateRef('controllerRef')

const { t } = useI18n()
const [Modal, modalApi] = useModal({})

const appSettingsStore = useAppSettingsStore()
const profilesStore = useProfilesStore()
const kernelApiStore = useKernelApiStore()

const handleStartKernel = async () => {
  try {
    await kernelApiStore.startKernel()
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  }
}

const handleShowQuickStart = () => {
  modalApi
    .setProps({
      title: 'subscribes.enterLink',
      footer: false,
      maskClosable: true,
    })
    .setComponent(h(QuickStart))
    .open()
}

const handleShowKernelLogs = () => {
  modalApi
    .setProps({
      title: 'home.overview.viewlog',
      width: '90',
      height: '90',
      submit: false,
      maskClosable: true,
    })
    .setComponent(h(KernelLogs))
    .open()
}

let scrollEventCount = 0
const resetScrollEventCount = debounce(() => (scrollEventCount = 0), 100)

const onMouseWheel = (e: WheelEvent) => {
  if (!appSettingsStore.app.kernel.running) return

  const currentScrollTop = controllerRef.value?.scrollTop ?? 0
  const isScrollingDown = e.deltaY > 0

  if (isScrollingDown || currentScrollTop === 0) {
    scrollEventCount += 1
  }

  if (scrollEventCount >= 3) {
    showController.value = isScrollingDown || currentScrollTop !== 0
  }

  resetScrollEventCount()
}

watch(showController, (v) => {
  if (v) {
    kernelApiStore.refreshProviderProxies()
  } else {
    kernelApiStore.refreshConfig()
  }
})
</script>

<template>
  <div @wheel="onMouseWheel" class="homeview">
    <div v-if="!appSettingsStore.app.kernel.running || kernelApiStore.loading" class="center">
      <img src="@/assets/logo.png" draggable="false" style="margin-bottom: 16px; height: 128px" />

      <template v-if="profilesStore.profiles.length === 0">
        <p>{{ t('home.noProfile', [APP_TITLE]) }}</p>
        <Button @click="handleShowQuickStart" type="primary">{{ t('home.quickStart') }}</Button>
      </template>

      <template v-else>
        <div class="profiles">
          <Card
            v-for="p in profilesStore.profiles.slice(0, 4)"
            :key="p.id"
            :selected="appSettingsStore.app.kernel.profile === p.id"
            @click="appSettingsStore.app.kernel.profile = p.id"
            class="profiles-card"
          >
            {{ p.name }}
          </Card>
          <Card @click="handleShowQuickStart" class="profiles-card">
            {{ t('home.quickStart') }}
          </Card>
        </div>
        <Button @click="handleStartKernel" :loading="kernelApiStore.loading" type="primary">
          {{ t('home.overview.start') }}
        </Button>
        <Button @click="handleShowKernelLogs" type="link" size="small">
          {{ t('home.overview.viewlog') }}
        </Button>
      </template>
    </div>

    <template v-else-if="!kernelApiStore.statusLoading">
      <div :class="{ blur: showController }">
        <OverView />
        <Divider>
          <Button @click="showController = true" type="link" size="small">
            {{ t('home.controller.name') }}
          </Button>
        </Divider>
      </div>

      <div
        ref="controllerRef"
        :style="{ transform: `translateY(${showController ? 0 : 100}%)` }"
        class="controller"
      >
        <GroupsController />
      </div>

      <Button
        v-show="showController"
        class="close-controller"
        @click="showController = false"
        type="text"
        size="small"
        icon="close"
      />
    </template>
  </div>

  <Modal />
</template>

<style lang="less" scoped>
.blur {
  filter: blur(50px);
}
.homeview {
  position: relative;
  overflow: hidden;
  height: 100%;

  .center {
    position: absolute;
    width: 100%;
    height: 90%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

.controller {
  position: absolute;
  inset: 0;
  transform: translateY(100%);
  padding-bottom: 32px;
  overflow-y: auto;
  transition: all 0.4s;
}

.close-controller {
  position: fixed;
  z-index: 2;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  border-radius: 8px;
  background-color: var(--card-bg);
}

.profiles {
  padding-bottom: 16px;
  display: flex;
  max-width: 90%;
  overflow-x: hidden;
  &-card {
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
    width: 120px;
    height: 60px;
    padding-top: 6px;
    margin: 8px;
  }
}
</style>
