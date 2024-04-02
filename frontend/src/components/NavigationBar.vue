<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import rawRoutes from '@/router/routes'

const { t } = useI18n()

const routes = rawRoutes.filter((r) => !r.meta?.hidden)
</script>

<template>
  <div class="nav">
    <div v-for="r in routes" :key="r.path">
      <RouterLink :to="r.path" custom #default="{ navigate, isActive }">
        <Button @click="navigate" :type="isActive ? 'link' : 'text'">
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
