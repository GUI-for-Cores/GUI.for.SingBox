<script setup lang="ts">
import { modal } from '@/utils'

import BranchDetail from './components/BranchDetail.vue'
import CoreConfiguration from './components/CoreConfig.vue'
import SwitchBranch from './components/SwitchBranch.vue'

const handleCoreConfiguraion = async (isAlpha: boolean) => {
  const m = modal({ title: 'settings.kernel.config.name', minWidth: '70' })
  m.setContent(CoreConfiguration, { isAlpha }).open()
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <BranchDetail :is-alpha="false" @config="handleCoreConfiguraion(false)" />
    <BranchDetail :is-alpha="true" @config="handleCoreConfiguraion(true)" />
    <SwitchBranch />
  </div>
</template>
