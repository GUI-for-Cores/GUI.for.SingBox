<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import rawRoutes from '@/router/routes'
import { useAppSettingsStore } from '@/stores'

const { t } = useI18n()
const appSettings = useAppSettingsStore()

const routes = computed(() =>
  rawRoutes.filter(
    (r) =>
      r.meta?.hidden === false ||
      (!r.meta?.hidden && appSettings.app.pages.includes(r.name! as string))
  )
)
</script>

<template>
  <div class="nav">
    <div v-for="r in routes" :key="r.path">
      <RouterLink :to="r.path" custom #default="{ navigate, isActive }">
        <Button @click="navigate" :type="isActive ? 'link' : 'text'" :icon="r.meta && r.meta.icon">
          {{ (r.meta && t(r.meta.name)) || r.name }}
        </Button>
      </RouterLink>
    </div>
  </div>
</template>

<style lang="less" scoped>
.nav {
  display: flex;
  justify-content: center;
}
</style>
