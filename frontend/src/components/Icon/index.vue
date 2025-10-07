<script setup lang="ts">
import { type Component } from 'vue'

import icons from './icons'

type IconFuncType = Record<string, { default: Component }>

export type IconType = (typeof icons)[number]

const Icons: IconFuncType = import.meta.glob('./*Icon.vue', { eager: true })

const IconsMap: Record<string, Component> = {}

Object.entries(Icons).forEach(([path, comp]) => {
  const name = path.slice(2, path.length - 8)
  const key = name.replace(name[0]!, name[0]!.toLowerCase())
  IconsMap[key] = comp.default
})

interface Props {
  icon: IconType
  size?: number
}

withDefaults(defineProps<Props>(), { size: 16 })
</script>

<template>
  <Component
    v-bind="$attrs"
    :is="IconsMap[icon] || IconsMap['error']"
    :width="size + 'px'"
    :height="size + 'px'"
    fill="var(--color)"
  />
</template>
