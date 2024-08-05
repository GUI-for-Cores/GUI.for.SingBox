<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion } from '@codemirror/autocomplete'

import { Theme } from '@/constant'
import { getCompletions } from '@/utils'
import { useAppSettingsStore } from '@/stores'

interface Props {
  editable?: boolean
  lang?: 'json' | 'javascript' | 'yaml'
  plugin?: Record<string, any>
}

const model = defineModel<string>({ default: '' })
const emit = defineEmits(['change'])
const props = withDefaults(defineProps<Props>(), {
  lang: 'json'
})

const ready = ref(false)
const appSettings = useAppSettingsStore()

const lang = { json, javascript, yaml }[props.lang]()
const linter = props.lang === 'json' ? jsonParseLinter() : undefined

const completion = computed(() =>
  autocompletion({
    override: props.lang === 'javascript' ? getCompletions(props.plugin) : null,
    optionClass: () => 'codeviewer-custom-font',
    tooltipClass: () => 'codeviewer-custom-font'
  })
)

const extensions = computed(() =>
  appSettings.themeMode === Theme.Dark ? [oneDark, completion.value] : [completion.value]
)

watch(model, (v) => emit('change', v))

onMounted(() => setTimeout(() => (ready.value = true), 100))
</script>

<template>
  <CodeMirror
    v-if="ready"
    v-model="model"
    :lang="lang"
    :linter="linter"
    :readonly="!editable"
    :extensions="extensions"
    tab
    basic
    wrap
    style="background: #fff"
  />
  <Button v-else loading type="link" style="display: flex; justify-content: center" />
</template>

<style lang="less" scoped>
:deep(.cm-editor) {
  height: 100%;
}
:deep(.cm-scroller) {
  font-family: monaco, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
}
:deep(.cm-focused) {
  outline: none;
}

:deep(.codeviewer-custom-font) {
  font-family: monaco, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
}
</style>
