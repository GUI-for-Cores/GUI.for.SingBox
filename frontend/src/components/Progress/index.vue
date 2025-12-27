<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  percent: number
  status?: 'primary' | 'warning' | 'danger'
  type?: 'circle' | 'line'
  radius?: number
}

const props = withDefaults(defineProps<Props>(), {
  status: 'primary',
  type: 'line',
  radius: 100,
})

const innerStyle = computed(() => ({
  width: (props.percent > 100 ? 100 : props.percent || 0) + '%',
}))

const circleStyle = computed(() => {
  const color = { warning: '#FFC107', danger: '#F44336', primary: 'var(--progress-inner-bg)' }[
    props.status
  ]
  const radius = props.radius * 2 + 'px'
  const percent = Math.min(props.percent || 0, 100)
  const mask = `radial-gradient(transparent ${props.radius * 0.6}px, #fff 0px)`
  const bg = `conic-gradient(${color} 0%, ${color} ${percent}%, var(--progress-bg) ${percent}%, var(--progress-bg) 100%)`
  return {
    width: radius,
    height: radius,
    background: bg,
    mask: mask,
    '-webkit-mask': mask,
  }
})
</script>

<template>
  <div v-if="type === 'line'" class="gui-progress-line h-10 rounded-8 overflow-hidden">
    <div
      :style="innerStyle"
      :class="props.status"
      class="inner h-full rounded-8 duration-200"
    ></div>
  </div>
  <div
    v-if="type === 'circle'"
    :style="circleStyle"
    class="gui-progress-circle relative rounded-full"
  ></div>
</template>

<style lang="less" scoped>
.gui-progress-line {
  background-color: var(--progress-bg);
  .inner {
    background-color: var(--progress-inner-bg);
  }
  .warning {
    background-color: #ffc107;
  }
  .danger {
    background-color: #f44336;
  }
}
</style>
