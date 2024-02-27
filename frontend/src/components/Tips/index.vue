<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, nextTick } from 'vue'

interface Props {
  position: { x: number; y: number }
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: ''
})

const model = defineModel<boolean>()

const domRef = ref<HTMLElement>()
const fixedPosition = ref({ x: 0, y: 0 })

const { t } = useI18n()

watch(
  () => props.position,
  ({ x, y }) => {
    if (!fixedPosition.value.x && !fixedPosition.value.y) {
      fixedPosition.value = { x, y }
    }
    nextTick(() => {
      if (domRef.value) {
        x = x - domRef.value.offsetWidth / 2
        y -= domRef.value.offsetHeight * 2
        fixedPosition.value = { x, y }
      }
    })
  }
)
</script>

<template>
  <div
    v-show="model"
    :style="{ left: fixedPosition.x + 'px', top: fixedPosition.y + 'px' }"
    ref="domRef"
    class="tips"
  >
    {{ t(message) }}
  </div>
</template>

<style lang="less" scoped>
.tips {
  transition: all 0.1s;
  pointer-events: none;
  position: fixed;
  z-index: 9999;
  background: var(--menu-bg);
  padding: 4px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-width: 90px;
  text-align: center;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>
