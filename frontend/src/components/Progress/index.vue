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
  const percent = props.percent >= 100 ? 101 : props.percent || 0
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
  <div v-if="type === 'line'" class="line">
    <div :style="innerStyle" :class="status" class="inner"></div>
  </div>
  <div v-if="type === 'circle'" :style="circleStyle" class="circle"></div>
</template>

<style lang="less" scoped>
.line {
  height: 10px;
  background-color: var(--progress-bg);
  border-radius: 8px;
  overflow: hidden;
  .inner {
    height: 100%;
    border-radius: 8px;
    background-color: var(--progress-inner-bg);
    transition: all 0.2s;
  }
  .warning {
    background-color: #ffc107;
  }
  .danger {
    background-color: #f44336;
  }
}

.circle {
  position: relative;
  border-radius: 50%;
}
</style>
