<script setup lang="ts">
import { nextTick } from 'vue'

import i18n from '@/lang'

interface Props {
  size?: 'default' | 'small'
  border?: 'default' | 'square'
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  border: 'default',
  disabled: false,
})

const model = defineModel<boolean>({ default: false })

const emits = defineEmits<{
  (e: 'change', val: boolean): void
}>()

const { t } = i18n.global

const toggle = () => {
  if (props.disabled) return
  model.value = !model.value
  nextTick(() => emits('change', model.value))
}
</script>

<template>
  <div
    @click="toggle"
    v-tips.slow="label"
    :class="[
      size,
      border,
      model ? 'on' : 'off',
      disabled ? 'disabled' : '',
      border === 'square' ? 'rounded-4' : 'rounded-full',
    ]"
    class="gui-switch relative cursor-pointer h-24 inline-flex items-center text-12"
  >
    <div
      :class="[border === 'square' ? 'rounded-4' : 'rounded-full']"
      class="dot absolute h-18 w-18 duration-200"
    ></div>

    <div v-if="$slots.default || label" class="slot line-clamp-1 break-all">
      <span v-if="label">{{ t(label) }}</span>
      <slot v-if="$slots.default"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-switch {
  min-width: 50px;
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
  .dot {
    width: 4px;
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
