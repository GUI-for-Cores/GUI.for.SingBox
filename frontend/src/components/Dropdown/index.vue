<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

type TriggerType = 'click' | 'hover'

interface Props {
  trigger?: TriggerType[]
  placement?: 'bottom' | 'top'
}

const props = withDefaults(defineProps<Props>(), {
  trigger: () => ['click'],
  placement: 'bottom'
})

const domRef = ref<HTMLElement>()
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
    class="dropdown"
  >
    <slot />
    <Transition name="overlay">
      <div
        v-show="show"
        :style="{
          bottom: placement === 'top' ? '100%' : '',
          top: placement === 'top' ? '' : '100%'
        }"
        class="overlay"
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

.dropdown {
  text-align: center;
  position: relative;
  word-break: keep-all;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.overlay {
  position: absolute;
  z-index: 99;
  background: var(--dropdown-bg);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
