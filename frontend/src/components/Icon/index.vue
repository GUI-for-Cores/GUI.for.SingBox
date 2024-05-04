<script setup lang="ts">
import type { Component } from 'vue'

import icons from './icons'

type IconFuncType = Record<string, { default: Component }>

export type IconType = (typeof icons)[number]

const Icons: IconFuncType = import.meta.glob('./*Icon.vue', { eager: true })

const IconsMap: Record<string, Component> = {}

for (const path in Icons) {
  let name = path.slice(2, path.length - 8)
  name = name.replace(name[0], name[0].toLowerCase())
  IconsMap[name] = Icons[path].default
}

interface Props {
  icon: IconType
  size?: number
}

withDefaults(defineProps<Props>(), { size: 16 })
</script>

<template>
  <Component
    :is="IconsMap[icon] || IconsMap['error']"
    v-bind="{ ...$attrs, width: size + 'px', height: size + 'px' }"
    fill="var(--color)"
  />
</template>

<style lang="less" scoped></style>
