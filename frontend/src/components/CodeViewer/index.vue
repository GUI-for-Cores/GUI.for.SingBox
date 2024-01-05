<script setup lang="ts">
interface Props {
  code: string
}

defineProps<Props>()
</script>

<template>
  <div class="code-viewer">
    <pre class="pre user-select">{{ code }}</pre>
  </div>
</template>

<style lang="less" scoped>
.pre {
  font-size: 14px;
  font-family: Menlo, Monaco, Consolas, 'Andale Mono', 'lucida console', 'Courier New', monospace;
}
</style>
