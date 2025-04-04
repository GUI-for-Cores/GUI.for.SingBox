<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  total: number
  size?: 'default' | 'small' | 'large'
  pageSize?: number
}

const model = defineModel('current', { default: 1 })
const props = withDefaults(defineProps<Props>(), { size: 'default', pageSize: 9 })

const pageNum = computed(() => Math.ceil(props.total / props.pageSize))
const pages = computed(() => {
  const total = pageNum.value
  const current = model.value
  if (total <= 8) return range(1, total)
  if (current <= 4) {
    return [...range(1, 7), 'next', total] as const
  } else if (current >= total - 3) {
    return [1, 'prev', ...range(total - 6, total)] as const
  } else {
    return [1, 'prev', ...range(current - 2, current + 2), 'next', total] as const
  }
})

const range = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
const handlePrev = () => (model.value = Math.max(1, model.value - 1))
const handleNext = () => (model.value = Math.min(pageNum.value, model.value + 1))
const handleJump = (page: number | 'prev' | 'next') => {
  if (typeof page === 'number') {
    model.value = page
    return
  }
  if (page === 'prev') {
    model.value = Math.max(1, model.value - 5)
  } else if (page === 'next') {
    model.value = Math.min(pageNum.value, model.value + 5)
  }
}
</script>

<template>
  <div>
    <Button @click="handlePrev" icon="arrowLeft" type="text" :size="size" />
    <Button v-if="pages.length === 0" type="text" :size="size"> ... </Button>
    <Button
      v-for="item in pages"
      :key="item"
      @click="handleJump(item)"
      :type="item === model ? 'primary' : 'text'"
      :size="size"
      style="min-width: 30px"
    >
      {{ item === 'prev' || item === 'next' ? '...' : item }}
    </Button>
    <Button @click="handleNext" icon="arrowRight" type="text" :size="size" />
  </div>
</template>
