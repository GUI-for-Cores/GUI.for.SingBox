<script setup lang="ts">
import type { Component } from 'vue'

import icons from './icons'

type IconFuncType = Record<string, { default: Component }>

const Icons: IconFuncType = import.meta.glob('./*Icon.vue', { eager: true })

const IconsMap: Record<string, Component> = {}

for (const path in Icons) {
  let name = path.slice(2, path.length - 8)
  name = name.replace(name[0], name[0].toLowerCase())
  IconsMap[name] = Icons[path].default
}

interface Props {
  icon: (typeof icons)[number]
}

defineProps<Props>()
</script>

<template>
  <Component :is="IconsMap[icon] || IconsMap['error']" v-bind="$attrs" fill="var(--color)" />
</template>

<style lang="less" scoped></style>
