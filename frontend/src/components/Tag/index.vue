<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  color?: 'cyan' | 'green' | 'red' | 'default' | 'primary'
  size?: 'small' | 'default'
  closeable?: boolean
}

withDefaults(defineProps<Props>(), {
  color: 'default',
  closable: false,
})

const emit = defineEmits(['close'])

const show = ref(true)
const handleClose = () => {
  emit('close')
  show.value = false
}
</script>

<template>
  <div
    v-if="show"
    :class="[color, size]"
    class="gui-tag px-8 mx-4 rounded-6 inline-block text-12 white-space-nowrap inline-flex items-center"
  >
    <slot></slot>
    <Icon
      v-if="closeable"
      @click="handleClose"
      :size="size === 'small' ? 12 : 14"
      icon="close"
      class="ml-2"
    />
  </div>
</template>

<style lang="less" scoped>
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
  color: #3d3d3d;
  background-color: #ffffff;
  border: 1px solid #898989;
}
.primary {
  color: var(--btn-primary-color);
  background-color: var(--primary-color);
  border: 1px solid var(--secondary-color);
}

.small {
  padding: 0 4px;
  margin: 0 2px;
  font-size: 10px;
}
</style>
