<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { useAppSettingsStore } from '@/stores'
import { Theme } from '@/constant'

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

const appSettings = useAppSettingsStore()

const extensions = computed(() => (appSettings.themeMode === Theme.Dark ? [oneDark] : []))

watch(code, (v) => emits('update:modelValue', v))
</script>

<template>
  <div class="code-viewer">
    <CodeMirror
      basic
      v-model="code"
      :lang="lang"
      :readonly="!editable"
      :extensions="extensions"
      tab
    />
  </div>
</template>

<style lang="less" scoped></style>
