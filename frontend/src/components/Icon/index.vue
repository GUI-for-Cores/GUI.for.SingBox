<script setup lang="ts">
import type { Component } from 'vue'

type IconFuncType = Record<string, { default: Component }>

const Icons: IconFuncType = import.meta.glob('./*Icon.vue', { eager: true })

const IconsMap: Record<string, Component> = {}

for (const path in Icons) {
  let name = path.slice(2, path.length - 8)
  name = name.replace(name[0], name[0].toLowerCase())
  IconsMap[name] = Icons[path].default
}

type IconType =
  | 'link'
  | 'edit'
  | 'loading'
  | 'selected'
  | 'disabled'
  | 'pin'
  | 'pinFill'
  | 'minimize'
  | 'maximize'
  | 'maximize2'
  | 'close'
  | 'arrowDown'
  | 'arrowRight'
  | 'speedTest'
  | 'empty'
  | 'github'
  | 'forbidden'
  | 'telegram'
  | 'expand'
  | 'collapse'
  | 'refresh'
  | 'settings'
  | 'settings'
  | 'log'
  | 'error'
  | 'stop'
  | 'reset'
  | 'folder'
  | 'restartApp'

interface Props {
  icon: IconType
}

defineProps<Props>()
</script>

<template>
  <Component :is="IconsMap[icon] || IconsMap['error']" v-bind="$attrs" fill="var(--color)" />
</template>

<style lang="less" scoped></style>
