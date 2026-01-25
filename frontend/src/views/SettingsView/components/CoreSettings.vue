<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

import { useModal } from '@/components/Modal'

const BranchDetail = defineAsyncComponent(() => import('./components/BranchDetail.vue'))
const CoreConfiguration = defineAsyncComponent(() => import('./components/CoreConfig.vue'))
const SwitchBranch = defineAsyncComponent(() => import('./components/SwitchBranch.vue'))

const [ConfigModal, modalApi] = useModal({})

const handleCoreConfiguraion = async (isAlpha: boolean) => {
  modalApi.setProps({ title: 'settings.kernel.config.name', minWidth: '70' })
  modalApi.setContent(CoreConfiguration, { isAlpha }).open()
}
</script>

<template>
  <div>
    <BranchDetail :is-alpha="false" @config="handleCoreConfiguraion(false)" />
    <BranchDetail :is-alpha="true" @config="handleCoreConfiguraion(true)" />
    <SwitchBranch />
    <ConfigModal />
  </div>
</template>
