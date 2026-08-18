<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'

interface Props {
  outbound: App.Outbound
}

defineProps<Props>()

const { t } = useI18n()
</script>

<template>
  <Divider>{{ t('kernel.outbounds.refs') }}</Divider>
  <Empty v-if="outbound.outbounds.length === 0" />
  <div v-draggable="[outbound.outbounds, DraggableOptions]">
    <Button v-for="item in outbound.outbounds" :key="item.id" type="link">
      {{ item.tag }}
    </Button>
  </div>
</template>
