<script setup lang="ts">
import { watch, onUnmounted, onMounted, useTemplateRef } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { keymap, placeholder as Placeholder } from '@codemirror/view'
import { linter } from '@codemirror/lint'
import { Compartment } from '@codemirror/state'
import { indentWithTab } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { autocompletion } from '@codemirror/autocomplete'
import { yaml } from '@codemirror/lang-yaml'
import { javascript } from '@codemirror/lang-javascript'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import * as prettier from 'prettier/standalone'
import * as parserBabel from 'prettier/parser-babel'
import * as parserYaml from 'prettier/parser-yaml'
import estreePlugin from 'prettier/plugins/estree'

import { useMessage } from '@/hooks'
import { debounce } from '@/utils'
import { Theme } from '@/enums/app'
import { useAppSettingsStore } from '@/stores'
import { getCompletions } from '@/utils/completion'

interface Props {
  editable?: boolean
  lang?: 'json' | 'javascript' | 'yaml'
  placeholder?: string
  plugin?: Record<string, any>
}

const model = defineModel<string>({ default: '' })
const emit = defineEmits(['change'])
const props = withDefaults(defineProps<Props>(), {
  lang: 'json',
  placeholder: '',
})

let editorView: EditorView
const themeCompartment = new Compartment()
const domRef = useTemplateRef('domRef')
const { message } = useMessage()
const appSettings = useAppSettingsStore()

const onChange = debounce((content: string) => {
  model.value = content
  emit('change', content)
}, 300)

const formatDoc = async (view: EditorView) => {
  const content = view.state.doc.toString()
  const cursor = view.state.selection.ranges[0].from
  try {
    const parser = { javascript: 'babel', yaml: 'yaml', json: 'json' }[props.lang]
    const plugins = {
      javascript: [parserBabel, estreePlugin],
      yaml: [parserYaml],
      json: [parserBabel, estreePlugin],
    }[props.lang]
    const { formatted, cursorOffset } = await prettier.formatWithCursor(content, {
      cursorOffset: cursor,
      parser,
      plugins,
      // https://github.com/GUI-for-Cores/Plugin-Hub/blob/main/.prettierrc.json
      semi: false,
      tabWidth: 2,
      singleQuote: true,
      printWidth: 160,
      trailingComma: 'none',
    })
    if (content !== formatted) {
      view.dispatch({
        changes: { from: 0, to: content.length, insert: formatted },
        selection: { anchor: cursorOffset, head: cursorOffset },
      })
    }
  } catch (error: any) {
    message.error(error.message || error)
  }
}

watch(
  () => appSettings.themeMode,
  (theme) => {
    editorView.dispatch({
      effects: themeCompartment.reconfigure(
        theme === Theme.Dark ? [EditorView.theme({}, { dark: true }), oneDark] : [],
      ),
    })
  },
)

watch(model, (content) => {
  if (content != editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    })
  }
})

onMounted(() => setTimeout(() => initEditor(), 100))
onUnmounted(() => editorView.destroy())

const initEditor = () => {
  domRef.value!.innerHTML = ''

  editorView = new EditorView({
    doc: model.value,
    parent: domRef.value!,
    extensions: [
      basicSetup,
      // keymap
      keymap.of([
        indentWithTab,
        {
          key: 'Shift-Alt-f',
          run: function (v: EditorView) {
            formatDoc(v)
            return true
          },
        },
      ]),
      // code wrap
      EditorView.lineWrapping,
      // editable
      EditorView.editable.of(props.editable),
      // placeholder
      Placeholder(props.placeholder),
      // theme
      themeCompartment.of(
        appSettings.themeMode === Theme.Dark ? [EditorView.theme({}, { dark: true }), oneDark] : [],
      ),
      ...(props.lang === 'javascript'
        ? [autocompletion({ override: getCompletions(props.plugin) })]
        : []),
      // lint
      ...(props.lang === 'json' ? [linter(jsonParseLinter())] : []),
      // lang
      ...(['javascript', 'json', 'yaml'].includes(props.lang)
        ? [{ javascript: javascript(), json: json(), yaml: yaml() }[props.lang]]
        : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString())
        }
      }),
    ],
  })
}
</script>

<template>
  <div ref="domRef">
    <Button loading type="link" style="display: flex; justify-content: center" />
  </div>
</template>

<style lang="less" scoped>
:deep(.cm-scroller) {
  font-family: monaco, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
}
:deep(.cm-focused) {
  outline: none;
}
</style>
