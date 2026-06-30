<script setup lang="ts">
import { Marked, type Token, type Tokens } from 'marked'
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, watch, type VNodeChild } from 'vue'

import { BrowserOpenURL } from '@/bridge'
import { APP_TITLE, APP_VERSION } from '@/utils'

import CodeViewer from '@/components/CodeViewer/index.vue'
import Divider from '@/components/Divider/index.vue'
import Table from '@/components/Table/index.vue'
import Tag from '@/components/Tag/index.vue'

import type { Column } from '@/components/Table/index.vue'

export interface Props {
  content: string
}

const props = defineProps<Props>()

const markdownParser = new Marked({ async: false })
const nodes = shallowRef<VNodeChild[]>([])
let renderFrame = 0

const blockquoteStyle = {
  borderLeft: '4px solid var(--primary-color)',
  padding: '8px',
  margin: '8px 0',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px',
  background: 'var(--card-bg)',
}

const linkStyle = {
  color: 'var(--primary-color)',
  cursor: 'pointer',
}

const renderInlineTokens = (tokens: Token[] = [], key: string): VNodeChild[] => {
  return tokens.flatMap((token, index) => renderInlineToken(token, `${key}-${index}`))
}

const renderInlineToken = (token: Token, key: string): VNodeChild | VNodeChild[] => {
  switch (token.type) {
    case 'escape':
    case 'text': {
      const textToken = token as Tokens.Text | Tokens.Escape
      return 'tokens' in textToken && textToken.tokens
        ? renderInlineTokens(textToken.tokens, key)
        : textToken.text
    }
    case 'strong': {
      const strongToken = token as Tokens.Strong
      return h('strong', { key }, renderInlineTokens(strongToken.tokens, key))
    }
    case 'em': {
      const emToken = token as Tokens.Em
      return h('em', { key }, renderInlineTokens(emToken.tokens, key))
    }
    case 'del': {
      const delToken = token as Tokens.Del
      return h('del', { key }, renderInlineTokens(delToken.tokens, key))
    }
    case 'codespan': {
      const codeToken = token as Tokens.Codespan
      return h(Tag, { key, color: 'cyan', size: 'small' }, () => codeToken.text)
    }
    case 'br':
      return h('br', { key })
    case 'link': {
      const linkToken = token as Tokens.Link
      return h(
        'span',
        {
          key,
          title: linkToken.title || undefined,
          style: linkStyle,
          onClick: () => BrowserOpenURL(linkToken.href),
        },
        renderInlineTokens(linkToken.tokens, key),
      )
    }
    case 'image': {
      const imageToken = token as Tokens.Image
      return h('img', {
        key,
        src: imageToken.href,
        alt: imageToken.text,
        title: imageToken.title || undefined,
        style: { maxWidth: '100%' },
      })
    }
    case 'html': {
      const htmlToken = token as Tokens.HTML | Tokens.Tag
      return h(htmlToken.block ? 'div' : 'span', { key, innerHTML: htmlToken.text })
    }
    case 'checkbox': {
      const checkboxToken = token as Tokens.Checkbox
      return h('input', {
        key,
        type: 'checkbox',
        checked: checkboxToken.checked,
        disabled: true,
      })
    }
    default: {
      const genericToken = token as Tokens.Generic
      if (genericToken.tokens) return renderInlineTokens(genericToken.tokens, key)
      return genericToken.raw || ''
    }
  }
}

const renderBlockTokens = (tokens: Token[] = [], key: string): VNodeChild[] => {
  return tokens.flatMap((token, index) => renderBlockToken(token, `${key}-${index}`))
}

const renderBlockToken = (token: Token, key: string): VNodeChild | VNodeChild[] => {
  switch (token.type) {
    case 'space':
    case 'def':
      return []
    case 'paragraph': {
      const paragraphToken = token as Tokens.Paragraph
      return h('p', { key, style: { margin: '0' } }, renderInlineTokens(paragraphToken.tokens, key))
    }
    case 'heading': {
      const headingToken = token as Tokens.Heading
      return h(
        `h${headingToken.depth}`,
        { key, style: { color: 'var(--primary-color)' } },
        ['# ', ...renderInlineTokens(headingToken.tokens, key)],
      )
    }
    case 'blockquote': {
      const blockquoteToken = token as Tokens.Blockquote
      return h('div', { key, style: blockquoteStyle }, renderBlockTokens(blockquoteToken.tokens, key))
    }
    case 'list': {
      const listToken = token as Tokens.List
      return h(
        listToken.ordered ? 'ol' : 'ul',
        {
          key,
          start: listToken.ordered && listToken.start ? listToken.start : undefined,
          style: { margin: '0', padding: '8px 16px' },
        },
        listToken.items.map((item, index) => renderListItem(item, `${key}-${index}`)),
      )
    }
    case 'hr':
      return h(Divider, { key }, () => `${APP_TITLE}/${APP_VERSION}`)
    case 'code': {
      const codeToken = token as Tokens.Code
      return h(CodeViewer, { key, modelValue: codeToken.text, lang: codeToken.lang })
    }
    case 'table':
      return renderTable(token as Tokens.Table, key)
    case 'html': {
      const htmlToken = token as Tokens.HTML | Tokens.Tag
      return h(htmlToken.block ? 'div' : 'span', { key, innerHTML: htmlToken.text })
    }
    case 'text': {
      const textToken = token as Tokens.Text
      return h(
        'p',
        { key, style: { margin: '0' } },
        textToken.tokens ? renderInlineTokens(textToken.tokens, key) : textToken.text,
      )
    }
    default: {
      const genericToken = token as Tokens.Generic
      if (genericToken.tokens) return renderBlockTokens(genericToken.tokens, key)
      return h('p', { key, style: { margin: '0' } }, genericToken.raw || '')
    }
  }
}

const renderListItem = (item: Tokens.ListItem, key: string) => {
  const children = renderBlockTokens(item.tokens, key)
  return h(
    'li',
    { key, style: { padding: '0' } },
    item.task
      ? [
          h('input', {
            key: `${key}-checkbox`,
            type: 'checkbox',
            checked: item.checked,
            disabled: true,
            style: { marginRight: '4px' },
          }),
          ...children,
        ]
      : children,
  )
}

const renderTable = (token: Tokens.Table, key: string) => {
  const columns = token.header.map<Column>((cell, index) => ({
    title: cell.text,
    key: `col_${index}`,
    align: cell.align || 'center',
    customRender: ({ value }) => h('div', value),
  }))

  const dataSource = token.rows.map((row, rowIndex) => {
    const record: Record<string, any> = { id: `${key}-row-${rowIndex}` }
    row.forEach((cell, cellIndex) => {
      record[`col_${cellIndex}`] = renderInlineTokens(cell.tokens, `${key}-${rowIndex}-${cellIndex}`)
    })
    return record
  })

  return h(Table, { key, columns, dataSource })
}

const renderMarkdown = (content: string) => {
  try {
    return renderBlockTokens(markdownParser.lexer(content), 'markdown')
  } catch (error: any) {
    console.error(error)
    return [h('pre', { class: 'select-text whitespace-pre-wrap' }, error?.message || String(error))]
  }
}

const scheduleRenderContent = () => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0
    nodes.value = renderMarkdown(props.content)
  })
}

const MarkdownContent = defineComponent({
  name: 'MarkdownViewerContent',
  setup() {
    return () => h('div', nodes.value)
  },
})

onMounted(scheduleRenderContent)
onBeforeUnmount(() => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
})

watch(() => props.content, scheduleRenderContent, { flush: 'post' })
</script>

<template>
  <MarkdownContent />
</template>
