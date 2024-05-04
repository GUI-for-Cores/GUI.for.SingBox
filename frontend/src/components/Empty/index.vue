<script lang="ts" setup>
interface Props {
  description?: string
}

withDefaults(defineProps<Props>(), {
  width: '90px',
  description: 'empty'
})
</script>

<template>
  <div class="empty">
    <Icon icon="empty" :size="64" />
    <slot name="description">
      <div class="desc">{{ description }}</div>
    </slot>
  </div>
</template>

<style lang="less" scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.desc {
  font-size: 12px;
  padding: 8px 0;
}
</style>
