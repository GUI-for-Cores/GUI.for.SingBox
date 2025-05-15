<script setup lang="ts">
interface Props {
  size?: 'default' | 'small'
  border?: 'default' | 'square'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  border: 'default',
  disabled: false,
})

const model = defineModel<boolean>()

const emits = defineEmits(['change'])

const toggle = () => {
  if (props.disabled) return
  model.value = !model.value
  emits('change', !model.value)
}
</script>

<template>
  <div
    @click="toggle"
    :style="{ 'justify-content': !model ? 'flex-start' : 'flex-end' }"
    :class="[size, border, model ? 'on' : 'off', disabled ? 'disabled' : '']"
    class="switch"
  >
    <div class="dot"></div>

    <div v-if="$slots.default" class="slot">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.switch {
  position: relative;
  cursor: pointer;
  min-width: 50px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  border-radius: 24px;
  transition: all 0.2s;
  font-size: 12px;
  .dot {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 18px;
    transition: all 0.2s;
  }
  .slot {
    transition: margin 0.2s;
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
    left: calc(100% - 22px);
    background-color: var(--switch-on-dot-bg);
  }

  .slot {
    margin-right: 26px;
    margin-left: 10px;
  }

  &.small {
    .dot {
      left: calc(100% - 16px);
    }
    .slot {
      margin-right: 20px;
      margin-left: 8px;
    }
  }

  &.square {
    .dot {
      left: calc(100% - 8px);
    }
    .slot {
      margin-right: 12px;
      margin-left: 8px;
    }
  }
}

.off {
  color: var(--card-color);
  background-color: var(--switch-off-bg);
  .dot {
    left: 4px;
    background-color: var(--switch-off-dot-bg);
  }

  .slot {
    margin-left: 26px;
    margin-right: 10px;
  }

  &.small {
    .dot {
      left: 4px;
    }
    .slot {
      margin-left: 20px;
      margin-right: 8px;
    }
  }

  &.square {
    .slot {
      margin-left: 12px;
      margin-right: 8px;
    }
  }
}

.disabled {
  cursor: not-allowed;
}
</style>
