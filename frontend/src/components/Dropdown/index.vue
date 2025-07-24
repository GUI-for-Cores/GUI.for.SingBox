<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

type TriggerType = 'click' | 'hover'

interface Props {
  trigger?: TriggerType[]
  placement?: 'bottom' | 'top'
}

const props = withDefaults(defineProps<Props>(), {
  trigger: () => ['click'],
  placement: 'bottom',
})

const domRef = useTemplateRef('domRef')
const show = ref(false)
const transformOrigin = ref(props.placement === 'top' ? 'bottom' : 'top')

const hasTrigger = (t: TriggerType) => props.trigger.includes(t)

const onMouseEnter = () => {
  if (hasTrigger('hover')) {
    show.value = true
  }
}

const onMouseLeave = () => {
  if (hasTrigger('hover')) {
    show.value = false
  }
}

const onClick = () => {
  if (hasTrigger('click')) {
    show.value = true
  }
}

const onDomClick = (e: MouseEvent) => {
  if (!domRef.value?.contains(e.target as any)) {
    show.value = false
  }
}

onMounted(() => {
  if (hasTrigger('click')) {
    document.addEventListener('click', onDomClick)
  }
})

onUnmounted(() => {
  if (hasTrigger('click')) {
    document.removeEventListener('click', onDomClick)
  }
})
</script>

<template>
  <div
    ref="domRef"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onClick"
    class="gui-dropdown relative flex flex-col items-center"
  >
    <slot></slot>
    <Transition name="overlay">
      <div
        v-show="show"
        :style="{
          bottom: placement === 'top' ? '100%' : '',
          top: placement === 'top' ? '' : '100%',
        }"
        class="gui-dropdown-overlay absolute z-99 rounded-8 backdrop-blur-sm shadow"
      >
        <slot name="overlay"> </slot>
      </div>
    </Transition>
  </div>
</template>

<style lang="less" scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition:
    transform 0.2s ease-in-out,
    opacity 0.2s ease-in-out;
  transform-origin: v-bind(transformOrigin);
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

.gui-dropdown-overlay {
  background: var(--dropdown-bg);
}
</style>
