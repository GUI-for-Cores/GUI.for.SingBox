<script setup lang="ts">
interface Props {
  modelValue?: boolean
  size?: 'default' | 'small'
  border?: 'default' | 'square'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'default',
  border: 'default'
})

const emits = defineEmits(['update:modelValue', 'change'])

const toggle = () => {
  const state = !props.modelValue
  emits('update:modelValue', state)
  emits('change', state)
}
</script>

<template>
  <div
    @click="toggle"
    :style="{ 'justify-content': !modelValue ? 'flex-start' : 'flex-end' }"
    :class="[size, border, modelValue ? 'on' : 'off']"
    class="switch"
  >
    <div v-if="$slots.default && !modelValue" class="slot">
      <slot />
    </div>

    <div class="dot"></div>

    <div v-if="$slots.default && modelValue" class="slot">
      <slot />
    </div>
  </div>
</template>

<style lang="less" scoped>
.switch {
  cursor: pointer;
  min-width: 50px;
  height: 24px;
  display: inline-flex;
  padding: 0 3px;
  align-items: center;
  border-radius: 24px;
  transition: all 0.2s;
  font-size: 12px;
  color: #fff;
  .dot {
    width: 18px;
    height: 18px;
    border-radius: 18px;
  }
  .slot {
    padding: 0 4px;
  }
}

.small {
  height: 20px;
  .dot {
    width: 12px;
    height: 12px;
  }
}

.square {
  border-radius: 4px;
  .dot {
    width: 4px;
    border-radius: 2px;
  }
}

.on {
  background-color: var(--switch-on-bg);
  .dot {
    background-color: var(--switch-on-dot-bg);
  }
}

.off {
  background-color: var(--switch-off-bg);
  .dot {
    background-color: var(--switch-off-dot-bg);
  }
}
</style>
