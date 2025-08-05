<script lang="ts" setup>
interface Props {
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: 'common.empty',
})
</script>

<template>
  <div class="gui-empty flex flex-col w-full h-full items-center justify-center">
    <Icon icon="empty" :size="64" />
    <slot name="description">
      <div class="text-12 py-8">{{ $t(description) }}</div>
    </slot>
  </div>
</template>
