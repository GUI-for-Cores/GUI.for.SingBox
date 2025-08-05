<script lang="ts" setup>
import { ref, watch, nextTick, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  position: { x: number; y: number }
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
})

const model = defineModel<boolean>()

const domRef = useTemplateRef('domRef')
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
  },
)
</script>

<template>
  <div
    v-show="model"
    :style="{ left: fixedPosition.x + 'px', top: fixedPosition.y + 'px' }"
    ref="domRef"
    class="gui-tips fixed z-9999 duration-100 pointer-events-none shadow whitespace-pre-wrap text-center text-12 p-4 rounded-8 min-w-64 backdrop-blur-sm"
  >
    {{ t(message) }}
  </div>
</template>

<style lang="less" scoped>
.gui-tips {
  background: var(--menu-bg);
}
</style>
