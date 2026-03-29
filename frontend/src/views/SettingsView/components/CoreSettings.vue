<script setup lang="ts">
import { useModal } from '@/components/Modal'

import BranchDetail from './components/BranchDetail.vue'
import CoreConfiguration from './components/CoreConfig.vue'
import SwitchBranch from './components/SwitchBranch.vue'

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
