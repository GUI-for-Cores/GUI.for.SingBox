<script setup lang="ts">
import AdvancedSettings from './components/AdvancedSettings.vue'
import BehaviorSettings from './components/BehaviorSettings.vue'
import FeatureSettings from './components/FeatureSettings.vue'
import PersonalizationSettings from './components/PersonalizationSettings.vue'
import SystemProxySettings from './components/SystemProxySettings.vue'
</script>

<template>
  <div class="flex flex-col gap-8 pr-20 mb-8">
    <PersonalizationSettings />
    <BehaviorSettings />
    <AdvancedSettings />
    <SystemProxySettings />
    <FeatureSettings />
  </div>
</template>
