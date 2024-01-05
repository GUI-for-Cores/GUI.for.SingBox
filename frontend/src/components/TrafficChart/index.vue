<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, onActivated } from 'vue'

import { formatBytes } from '@/utils'

interface Props {
  height?: number
  padding?: number
  legend?: string[]
  series: number[][]
}

const props = withDefaults(defineProps<Props>(), {
  height: 214,
  padding: 50,
  legend: () => ['upload', 'download']
})

const MAX_HISTORY = 60
const svgRef = ref<SVGElement>()
const width = ref(200)
const points = ref<string[]>([])
const showLines = ref([true, true])
const fillColors = ['#8851e350', '#2e9ae550']

const strokeColors = computed(() => {
  const upload = showLines.value[0] ? '#8851e3' : 'gray'
  const download = showLines.value[1] ? '#2e9ae5' : 'gray'
  return [upload, download]
})

const maxValue = computed(() => {
  const maxUpload = Math.max(...props.series[0], props.height)
  const maxDownload = Math.max(...props.series[1], props.height)
  if (showLines.value[0] && showLines.value[1]) return Math.max(maxUpload, maxDownload)
  if (showLines.value[0]) return maxUpload
  if (showLines.value[1]) return maxDownload
  return props.height
})

const updateSvgWidth = () => {
  if (svgRef.value) {
    width.value = svgRef.value.clientWidth
    updateChart()
  }
}

const updateChart = () => {
  let { height, padding } = props
  const paddingY = height / 8
  height -= paddingY
  points.value = props.series.map((s, index) => {
    if (!showLines.value[index]) return ''
    const newS = [...s]
    if (newS.length < MAX_HISTORY) {
      newS.unshift(...new Array(MAX_HISTORY - s.length).fill(0))
    }
    const spacing = (width.value - padding) / newS.length
    const point = newS.reduce((p, c, i) => {
      const x = Math.floor(i * spacing) + padding
      const y = Math.floor(height - (c / maxValue.value) * height) + paddingY - 6
      return i === 0 ? x + ',' + y : p + ',' + x + ',' + y
    }, '')
    const startPos = padding + ',' + (props.height - 6)
    const endPos = Math.floor((MAX_HISTORY - 1) * spacing + padding) + ',' + (props.height - 6)
    return startPos + ',' + point + ',' + endPos
  })
}

const toggleUpload = () => {
  showLines.value[0] = !showLines.value[0]
  updateChart()
}

const toggleDownload = () => {
  showLines.value[1] = !showLines.value[1]
  updateChart()
}

onMounted(() => {
  updateSvgWidth()
  window.addEventListener('resize', updateSvgWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSvgWidth)
})

onActivated(updateSvgWidth)

watch(() => props.series, updateChart, { deep: true })
</script>

<template>
  <div class="chart">
    <svg ref="svgRef" :height="height + 'px'" width="100%" xmlns="http://www.w3.org/2000/svg">
      <text
        v-for="i in 8"
        :key="i"
        :y="i * (height / 8) - 4"
        style="font-size: 8px"
        x="4"
        fill="var(--primary-color)"
      >
        {{ formatBytes(maxValue - (i - 1) * (maxValue / 7)) }}
      </text>

      <line
        v-for="i in 8"
        :key="i"
        :y1="i * (height / 8) - 7"
        :x2="width - 2"
        :y2="i * (height / 8) - 7"
        :x1="padding"
        stroke-dasharray="1 4"
        stroke="var(--color)"
      />

      <template v-for="(point, index) in points">
        <polyline
          v-if="showLines[index]"
          :key="index"
          :points="point"
          :stroke="strokeColors[index]"
          :fill="fillColors[index]"
          stroke-width="2"
        />
      </template>

      <circle
        :cx="width / 2 - 40"
        :fill="strokeColors[0]"
        @click="toggleUpload"
        r="3"
        cy="10"
        class="pointer"
      />
      <circle
        :cx="width / 2 + 20"
        :fill="strokeColors[1]"
        @click="toggleDownload"
        r="3"
        cy="10"
        class="pointer"
      />
      <text
        :x="width / 2 - 34"
        :fill="strokeColors[0]"
        @click="toggleUpload"
        y="14"
        class="pointer"
      >
        {{ legend[0] }}
      </text>
      <text
        :x="width / 2 + 28"
        :fill="strokeColors[1]"
        @click="toggleDownload"
        y="14"
        class="pointer"
      >
        {{ legend[1] }}
      </text>
    </svg>
  </div>
</template>

<style lang="less" scoped>
.chart {
  background: var(--card-bg);
  border-radius: 8px;
}

.pointer {
  font-size: 10px;
  cursor: pointer;
}
</style>
