<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, type RouteRecordRaw } from 'vue-router'

import rawRoutes from '@/router/routes'

const route = useRoute()

const { t } = useI18n()

const routes = rawRoutes.filter((r) => !r.meta?.hidden)

const isActive = (r: RouteRecordRaw) => route.name === r.name
</script>

<template>
  <div class="nav">
    <div v-for="r in routes" :key="r.path">
      <RouterLink :to="r.path" draggable="false">
        <Button :type="isActive(r) ? 'link' : 'text'">
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
