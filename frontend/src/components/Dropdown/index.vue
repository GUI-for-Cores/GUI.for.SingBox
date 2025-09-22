<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick, useTemplateRef } from 'vue'

type TriggerType = 'click' | 'hover'

interface Props {
  trigger?: TriggerType[]
  placement?: 'bottom' | 'top'
}

const props = withDefaults(defineProps<Props>(), {
  trigger: () => ['hover'],
  placement: 'bottom',
})

const domRef = useTemplateRef('domRef')
const overlayRef = useTemplateRef('overlayRef')
const overlayStyle = ref({ top: 'auto', left: '0px', bottom: 'auto', maxHeight: 'none' })
const show = ref(false)
const transformOrigin = ref(props.placement === 'top' ? 'bottom' : 'top')

const updatePosition = () => {
  if (!domRef.value || !overlayRef.value || !show.value) return

  const triggerRect = domRef.value.getBoundingClientRect()
  const overlayEl = overlayRef.value

  overlayEl.style.minWidth = `${triggerRect.width}px`

  const overlayHeight = overlayEl.offsetHeight
  const overlayWidth = overlayEl.offsetWidth

  const screenEdgeMargin = 8

  const totalSpaceBelow = window.innerHeight - triggerRect.bottom
  const totalSpaceAbove = triggerRect.top

  let finalPlacement: 'top' | 'bottom'

  const canPlaceBottom = totalSpaceBelow >= overlayHeight
  const canPlaceTop = totalSpaceAbove >= overlayHeight

  if (props.placement === 'bottom') {
    if (canPlaceBottom) {
      finalPlacement = 'bottom'
    } else if (canPlaceTop) {
      finalPlacement = 'top'
    } else {
      finalPlacement = totalSpaceBelow > totalSpaceAbove ? 'bottom' : 'top'
    }
  } else {
    if (canPlaceTop) {
      finalPlacement = 'top'
    } else if (canPlaceBottom) {
      finalPlacement = 'bottom'
    } else {
      finalPlacement = totalSpaceAbove > totalSpaceBelow ? 'top' : 'bottom'
    }
  }

  transformOrigin.value = finalPlacement === 'top' ? 'bottom' : 'top'

  if (finalPlacement === 'bottom') {
    overlayStyle.value.top = `${triggerRect.bottom}px`
    overlayStyle.value.bottom = 'auto'
    const availableHeight = totalSpaceBelow - screenEdgeMargin
    overlayStyle.value.maxHeight = `${Math.max(0, availableHeight)}px`
  } else {
    overlayStyle.value.bottom = `${window.innerHeight - triggerRect.top}px`
    overlayStyle.value.top = 'auto'
    const availableHeight = totalSpaceAbove - screenEdgeMargin
    overlayStyle.value.maxHeight = `${Math.max(0, availableHeight)}px`
  }

  let left = triggerRect.left + triggerRect.width / 2 - overlayWidth / 2

  if (left + overlayWidth > window.innerWidth - screenEdgeMargin) {
    left = window.innerWidth - overlayWidth - screenEdgeMargin
  }
  if (left < screenEdgeMargin) {
    left = screenEdgeMargin
  }
  overlayStyle.value.left = `${left}px`
}

watch(show, async (isVisible) => {
  if (isVisible) {
    await nextTick()
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
  } else {
    window.removeEventListener('scroll', updatePosition, true)
    window.removeEventListener('resize', updatePosition)
  }
})

const open = () => (show.value = true)
const close = () => (show.value = false)
const toggle = () => (show.value = !show.value)
const hasTrigger = (t: TriggerType) => props.trigger.includes(t)

const onMouseEnter = () => {
  if (hasTrigger('hover')) {
    open()
  }
}

const onMouseLeave = () => {
  if (hasTrigger('hover')) {
    close()
  }
}

const onClick = () => {
  if (hasTrigger('click')) {
    show.value = !show.value
  }
}

const onDomClick = (e: MouseEvent) => {
  if (!domRef.value?.contains(e.target as Node) && !overlayRef.value?.contains(e.target as Node)) {
    close()
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
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div
    ref="domRef"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onClick"
    class="gui-dropdown relative inline-flex flex-col items-center"
  >
    <slot v-bind="{ open, close, toggle }"></slot>
    <Transition name="overlay">
      <div
        v-show="show"
        ref="overlayRef"
        :style="overlayStyle"
        class="gui-dropdown-overlay fixed z-99 rounded-8 backdrop-blur-sm shadow overflow-y-auto"
        @click.stop
      >
        <slot name="overlay" v-bind="{ open, close, toggle }"></slot>
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
