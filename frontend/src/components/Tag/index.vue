<script setup lang="ts">
interface Props {
  color?: 'cyan' | 'green' | 'red' | 'default'
}

withDefaults(defineProps<Props>(), {
  color: 'default'
})
</script>

<template>
  <div :class="color" class="tag">
    <slot />
  </div>
</template>

<style lang="less" scoped>
.tag {
  padding: 0 7px;
  margin: 0 4px;
  border-radius: 6px;
  display: inline-block;
  font-size: 12px;
}
.cyan {
  color: #22a3a7;
  background-color: #e6fffb;
  border: 1px solid #22a3a7;
}
.green {
  color: #389e0d;
  background-color: #f6ffed;
  border: 1px solid #389e0d;
}
.red {
  color: #d52e3b;
  background-color: #fff1f0;
  border: 1px solid #d52e3b;
}
.default {
  color: #1e1e1e;
  background-color: #fafafa;
  border: 1px solid #1e1e1e;
}
</style>
