<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AboutView from '@/views/AboutView.vue'
import GeneralSetting from './components/GeneralSetting.vue'
import KernelView from '@/views/KernelView.vue'
import ComponentsView from '@/views/ComponentsView.vue'

const settings = [
  { key: 'general', tab: 'settings.general' },
  { key: 'kernel', tab: 'router.kernel' }
  // { key: 'components', tab: 'router.components' }
]

const showAbout = ref(false)
const activeKey = ref(settings[0].key)

const { t } = useI18n()
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="settings" height="100%">
    <template #general>
      <GeneralSetting />
    </template>

    <template #kernel>
      <KernelView />
    </template>

    <template #components>
      <ComponentsView />
    </template>

    <template #extra>
      <Button @click="showAbout = true" type="text">
        {{ t('router.about') }}
      </Button>
    </template>
  </Tabs>

  <Modal v-model:open="showAbout" :cancel="false" :submit="false" min-width="50" mask-closable>
    <AboutView />
  </Modal>
</template>

<style lang="less" scoped></style>
