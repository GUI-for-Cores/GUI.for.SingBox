<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    pt?: number
    pr?: number
    pb?: number
    pl?: number
  }>(),
  {
    pt: 0,
    pr: 0,
    pb: 0,
    pl: 0,
  },
)

const scrollRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
let resizeObserver: ResizeObserver | undefined

function updateOverflow() {
  const el = scrollRef.value
  if (!el) return

  hasOverflow.value = el.scrollHeight > el.clientHeight
}

const spacing = computed(() => {
  const pr = hasOverflow.value ? props.pr - 8 - 6 : props.pr
  return {
    paddingLeft: props.pl + 'px',
    marginRight: hasOverflow.value ? '8px' : undefined,
    paddingRight: pr > 0 ? pr + 'px' : undefined,
    paddingTop: props.pt + 'px',
    paddingBottom: props.pb + 'px',
  }
})

onMounted(async () => {
  await nextTick()
  updateOverflow()

  resizeObserver = new ResizeObserver(updateOverflow)

  if (scrollRef.value) {
    resizeObserver.observe(scrollRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="scrollRef" :style="spacing" class="gui-scroll-view flex-1 overflow-y-auto">
    <slot></slot>
  </div>
</template>

<style lang="less">
.gui-scroll-view::-webkit-scrollbar-track {
  margin-block: v-bind('props.pb+"px"');
}
</style>
