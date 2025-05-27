<script setup lang="ts">
import BranchDetail from './components/BranchDetail.vue'
import SwitchBranch from './components/SwitchBranch.vue'
</script>

<template>
  <div>
    <BranchDetail :is-alpha="false" />
    <BranchDetail :is-alpha="true" />
    <SwitchBranch />
  </div>
</template>
