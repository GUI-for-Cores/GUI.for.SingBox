<script setup lang="ts">
import { ref, watch } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

interface Props {
  modelValue: string
  editable?: boolean
  lang?: 'json' | 'javascript'
}

const props = withDefaults(defineProps<Props>(), {
  lang: 'json'
})

const emits = defineEmits(['update:modelValue'])

const code = ref(props.modelValue)

const lang = { json, javascript }[props.lang]()

watch(code, (v) => emits('update:modelValue', v))
</script>

<template>
  <div class="code-viewer">
    <CodeMirror
      basic
      v-model="code"
      :lang="lang"
      :readonly="!editable"
      :extensions="[oneDark]"
      tab
    />
  </div>
</template>

<style lang="less" scoped></style>
