<script setup lang="ts">
import Prism from 'prismjs'
import { computed } from 'vue'

import { ClipboardSetText } from '@/bridge'
import { message } from '@/utils'

import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-powershell'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-diff'

interface Props {
  modelValue?: string
  lang?: string
  copyable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  lang: '',
  copyable: true,
})

const langAliases: Record<string, string> = {
  cjs: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  pwsh: 'powershell',
  ps1: 'powershell',
  html: 'markup',
  svg: 'markup',
  vue: 'markup',
  xml: 'markup',
  md: 'markdown',
  patch: 'diff',
}

const plainLangs = new Set(['', 'none', 'plain', 'plaintext', 'text', 'txt'])

const escapeHtml = (str: string) =>
  str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const rawLang = computed(() => props.lang.trim())

const normalizedLang = computed(() => {
  const lang = rawLang.value.toLowerCase().split(/\s+/)[0] || ''
  if (plainLangs.has(lang)) return ''
  return langAliases[lang] || lang
})

const displayLang = computed(() => rawLang.value || 'text')
const grammar = computed(() => Prism.languages[normalizedLang.value])

const html = computed(() => {
  const code = props.modelValue || ''
  if (!grammar.value || !normalizedLang.value) return escapeHtml(code)
  return Prism.highlight(code, grammar.value, normalizedLang.value)
})

const onCopy = async () => {
  const ok = await ClipboardSetText(props.modelValue || '')
  ok ? message.success('common.copied') : message.error('ClipboardSetText Error')
}
</script>

<template>
  <div class="code-block-viewer my-8 rounded-6">
    <div class="code-block-toolbar flex items-center justify-between gap-8 min-h-32 px-8 py-4">
      <div class="inline-flex min-w-0 items-center gap-4 text-12">
        <Icon icon="code" :size="14" color="currentColor" />
        <span>{{ displayLang }}</span>
      </div>
      <Button v-if="copyable" type="text" size="small" icon="copy" @click="onCopy">
        {{ $t('common.copy') }}
      </Button>
    </div>
    <pre
      class="m-0 overflow-auto px-12 py-8 select-text"
      :class="normalizedLang ? `language-${normalizedLang}` : 'language-plain'"
    ><code class="code-block-code" v-html="html"></code></pre>
  </div>
</template>

<style lang="less" scoped>
.code-block-viewer {
  border: 1px solid var(--divider-color);
  background: var(--card-bg);
}

.code-block-toolbar {
  color: var(--card-color);
  border-bottom: 1px solid var(--divider-color);
}

.code-block-code {
  font-family: monaco, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  white-space: pre;
}

:deep(.token.comment),
:deep(.token.prolog),
:deep(.token.doctype),
:deep(.token.cdata) {
  color: #708090;
}

:deep(.token.punctuation) {
  color: #999;
}

:deep(.token.namespace) {
  opacity: 0.7;
}

:deep(.token.property),
:deep(.token.tag),
:deep(.token.boolean),
:deep(.token.number),
:deep(.token.constant),
:deep(.token.symbol),
:deep(.token.deleted) {
  color: #d73a49;
}

:deep(.token.selector),
:deep(.token.attr-name),
:deep(.token.string),
:deep(.token.char),
:deep(.token.builtin),
:deep(.token.inserted) {
  color: #22863a;
}

:deep(.token.operator),
:deep(.token.entity),
:deep(.token.url),
:deep(.language-css .token.string),
:deep(.style .token.string) {
  color: #005cc5;
}

:deep(.token.atrule),
:deep(.token.attr-value),
:deep(.token.keyword) {
  color: #d73a49;
}

:deep(.token.function),
:deep(.token.class-name) {
  color: #6f42c1;
}

:deep(.token.regex),
:deep(.token.important),
:deep(.token.variable) {
  color: #e36209;
}

:deep(.token.important),
:deep(.token.bold) {
  font-weight: 700;
}

:deep(.token.italic) {
  font-style: italic;
}
</style>
