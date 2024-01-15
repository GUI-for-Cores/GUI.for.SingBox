<script setup lang="ts">
import { computed } from 'vue'
import CodeMirror from 'vue-codemirror6'

import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'

import { debounce } from '@/utils'
import { Theme } from '@/constant'
import { useAppSettingsStore } from '@/stores'

interface Props {
  modelValue: string
  editable?: boolean
  lang?: 'json' | 'javascript'
}

const props = withDefaults(defineProps<Props>(), {
  lang: 'json'
})

const emits = defineEmits(['update:modelValue'])



const lang = { json, javascript }[props.lang]()

const appSettings = useAppSettingsStore()

const extensions = computed(() => (appSettings.themeMode === Theme.Dark ? [oneDark] : []))

const onChange = debounce((e: any) => {
  const code = e.doc.text.join('\n')
  if (props.modelValue !== code) {
    emits('update:modelValue', e.doc.text.join('\n'))
  }
}, 500)
</script>

<template>
  <div class="code-viewer">
    <CodeMirror
      :modelValue="modelValue"

      :lang="lang"
      :readonly="!editable"
      :extensions="extensions"
      @change="onChange"
      tab
      basic
    />
  </div>
</template>

<style lang="less" scoped></style>
