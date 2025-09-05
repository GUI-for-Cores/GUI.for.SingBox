<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { ControllerCloseMode } from '@/enums/app'
import { useAppSettingsStore, useProfilesStore, useKernelApiStore } from '@/stores'
import { APP_TITLE, debounce, message } from '@/utils'

import { useModal } from '@/components/Modal'

import GroupsController from './components/GroupsController.vue'
import KernelLogs from './components/KernelLogs.vue'
import OverView from './components/OverView.vue'
import QuickStart from './components/QuickStart.vue'

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
  modalApi.setProps({ title: 'subscribes.enterLink' })
  modalApi.setContent(QuickStart).open()
}

const handleShowKernelLogs = () => {
  modalApi.setProps({
    title: 'home.overview.viewlog',
    width: '90',
    height: '90',
    submit: false,
    cancelText: 'common.close',
    maskClosable: true,
  })
  modalApi.setContent(KernelLogs).open()
}

let scrollEventCount = 0
const resetScrollEventCount = debounce(() => (scrollEventCount = 0), 100)

const onMouseWheel = (e: WheelEvent) => {
  if (!appSettingsStore.app.kernel.running) return

  const isScrollingDown = e.deltaY > 0

  if (
    isScrollingDown ||
    appSettingsStore.app.kernel.controllerCloseMode === ControllerCloseMode.All
  ) {
    const currentScrollTop = controllerRef.value?.scrollTop ?? 0
    if (isScrollingDown || currentScrollTop === 0) {
      scrollEventCount += 1
    }
    if (scrollEventCount >= appSettingsStore.app.kernel.controllerSensitivity) {
      showController.value = isScrollingDown || currentScrollTop !== 0
    }
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
  <div @wheel="onMouseWheel" class="relative overflow-hidden h-full">
    <div
      v-if="!appSettingsStore.app.kernel.running || kernelApiStore.loading"
      class="w-full h-[90%] flex flex-col items-center justify-center"
    >
      <img src="@/assets/logo.png" draggable="false" class="w-128 mb-16" />

      <template v-if="profilesStore.profiles.length === 0">
        <p>{{ t('home.noProfile', [APP_TITLE]) }}</p>
        <Button @click="handleShowQuickStart" type="primary">{{ t('home.quickStart') }}</Button>
      </template>

      <template v-else>
        <div class="flex gap-8 mb-32">
          <Card
            v-for="p in profilesStore.profiles.slice(0, profilesStore.profiles.length > 4 ? 3 : 4)"
            :key="p.id"
            :selected="appSettingsStore.app.kernel.profile === p.id"
            @click="appSettingsStore.app.kernel.profile = p.id"
          >
            <div
              class="w-128 h-full flex items-center justify-center py-24 text-center cursor-pointer font-bold text-12"
            >
              {{ p.name }}
            </div>
          </Card>
          <Dropdown v-if="profilesStore.profiles.length > 4" placement="top">
            <Card class="h-full">
              <div
                class="w-128 h-full flex items-center justify-center py-24 text-center cursor-pointer font-bold text-12"
              >
                ...
              </div>
            </Card>
            <template #overlay>
              <div class="flex flex-col py-8">
                <Button
                  v-for="p in profilesStore.profiles.slice(3)"
                  :key="p.id"
                  @click="appSettingsStore.app.kernel.profile = p.id"
                >
                  <div class="min-w-32 w-full flex items-center justify-between">
                    {{ p.name }}
                    <Icon v-if="appSettingsStore.app.kernel.profile === p.id" icon="selected" />
                  </div>
                </Button>
              </div>
            </template>
          </Dropdown>
          <Card @click="handleShowQuickStart">
            <div
              class="w-128 h-full flex items-center justify-center py-24 text-center cursor-pointer font-bold text-12"
            >
              {{ t('home.quickStart') }}
            </div>
          </Card>
        </div>
        <Button @click="handleStartKernel" :loading="kernelApiStore.loading" type="primary">
          {{ t('home.overview.start') }}
        </Button>
        <Button @click="handleShowKernelLogs" type="link" size="small" class="mt-4">
          {{ t('home.overview.viewlog') }}
        </Button>
      </template>
    </div>

    <template v-else-if="!kernelApiStore.statusLoading">
      <div :class="{ 'blur-3xl': showController }">
        <OverView />
        <Divider>
          <Button @click="showController = true" type="link" size="small">
            {{ t('home.controller.name') }}
          </Button>
        </Divider>
      </div>

      <div
        ref="controllerRef"
        :class="showController ? 'translate-y-0' : 'translate-y-full'"
        class="absolute inset-0 pb-32 overflow-y-auto duration-400"
      >
        <GroupsController />
      </div>

      <Button
        v-show="showController"
        class="fixed left-1/2 -translate-x-1/2 bottom-12 z-2"
        style="background-color: var(--card-bg)"
        @click="showController = false"
        type="text"
        size="small"
        icon="close"
      />
    </template>
  </div>

  <Modal />
</template>
