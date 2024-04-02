<script setup lang="ts">
interface Props {
  size?: 'default' | 'small'
  border?: 'default' | 'square'
}

withDefaults(defineProps<Props>(), {
  size: 'default',
  border: 'default'
})

const model = defineModel<boolean>()

const emits = defineEmits(['change'])

const toggle = () => {
  model.value = !model.value
  emits('change', !model.value)
}
</script>

<template>
  <div
    @click="toggle"
    :style="{ 'justify-content': !model ? 'flex-start' : 'flex-end' }"
    :class="[size, border, model ? 'on' : 'off']"
    class="switch"
  >
    <div v-if="$slots.default && !model" class="slot">
      <slot />
    </div>

    <div class="dot"></div>

    <div v-if="$slots.default && model" class="slot">
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
  color: var(--card-color);
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
  color: #fff;
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
