<script setup lang="ts">
import { computed } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'

import { Theme } from '@/constant'
import { useAppSettingsStore } from '@/stores'

interface Props {
  editable?: boolean
  lang?: 'json' | 'javascript'
}

const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<Props>(), {
  lang: 'json'
})

const lang = { json, javascript }[props.lang]()

const appSettings = useAppSettingsStore()

const extensions = computed(() => (appSettings.themeMode === Theme.Dark ? [oneDark] : []))
</script>

<template>
  <CodeMirror
    v-model="model"
    :lang="lang"
    :readonly="!editable"
    :extensions="extensions"
    tab
    basic
  />
</template>

<style lang="less" scoped></style>
