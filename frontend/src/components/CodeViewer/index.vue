<script setup lang="ts">
interface Props {
  modelValue: string
  editable?: boolean
}

defineEmits(['update:modelValue'])

defineProps<Props>()
</script>

<template>
  <div class="code-viewer">
    <textarea
      :value="modelValue"
      :disabled="!editable"
      @input="$emit('update:modelValue', ($event as any).target.value)"
      class="code"
    ></textarea>
  </div>
</template>

<style lang="less" scoped>
.code {
  font-size: 14px;
  width: 100%;
  min-height: 200px;
  background: transparent;
  color: var(--color);
  resize: none;
  font-family: Menlo, Monaco, Consolas, 'Andale Mono', 'lucida console', 'Courier New', monospace;
}
</style>
