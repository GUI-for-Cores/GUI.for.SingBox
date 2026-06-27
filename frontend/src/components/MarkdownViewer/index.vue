<script setup lang="ts">
import { Marked } from 'marked'
import { h, nextTick, onBeforeUnmount, onMounted, ref, render, watch, type VNode } from 'vue'

import { APP_TITLE, APP_VERSION, bindAppContext, sampleID } from '@/utils'

import CodeViewer from '@/components/CodeViewer/index.vue'
import Divider from '@/components/Divider/index.vue'
import Table from '@/components/Table/index.vue'
import Tag from '@/components/Tag/index.vue'

import type { Column } from '@/components/Table/index.vue'

export interface Props {
  content: string
}

const props = defineProps<Props>()

const html = ref('')
const domContainers: (() => void)[] = []
let renderFrame = 0
let renderRequest = 0
let isUnmounted = false
let pendingMounts: { containerId: string; comp: VNode }[] = []

const queueCustomComp = (containerId: string, comp: VNode) => {
  bindAppContext(comp)
  pendingMounts.push({ containerId, comp })
}

const markdownParser = new Marked({
  async: false,
  renderer: {
    image({ href, title, text }) {
      return `<img src="${href}" alt="${title || text}" style="max-width: 100%">`
    },
    link({ href, title }) {
      return `<span onclick="Plugins.BrowserOpenURL('${href}')" style="color: var(--primary-color); cursor: pointer">${title || href}</span>`
    },
    blockquote({ tokens }) {
      const text = this.parser.parse(tokens)
      return `<div style="border-left: 4px solid var(--primary-color); padding: 8px; margin: 8px 0; display: flex; flex-direction: column; border-radius: 4px; background: var(--card-bg)">${text}</div>`
    },
    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens)
      return `<p style="margin: 0">${text}</p>`
    },
    list({ ordered, items }) {
      const children = items.reduce((str, { tokens }) => {
        const text = this.parser.parse(tokens)
        return str + `<li style="padding: 0">${text}</li>`
      }, '')
      const tag = ordered ? 'ol' : 'ul'
      return `<${tag} style="margin: 0; padding: 8px 16px">${children}</${tag}>`
    },
    hr() {
      const containerId = 'Divider_' + sampleID()
      const comp = h(Divider, () => APP_TITLE + '/' + APP_VERSION)
      queueCustomComp(containerId, comp)
      return `<div id="${containerId}"></div>`
    },
    heading({ text, depth }) {
      return `<h${depth} style="color: var(--primary-color)"># ${text}</h${depth}>`
    },
    codespan({ text }) {
      const containerId = 'Tag_' + sampleID()
      const comp = h(Tag, { color: 'cyan', size: 'small' }, () => text)
      queueCustomComp(containerId, comp)
      return `<span id="${containerId}"></span>`
    },
    code({ text, lang }) {
      const containerId = 'CodeViewer_' + sampleID()
      const comp = h(CodeViewer, { editable: false, modelValue: text, lang: lang as any })
      queueCustomComp(containerId, comp)
      return `<div id="${containerId}"></div>`
    },
    table({ header, rows }) {
      const containerId = 'Table_' + sampleID()
      const comp = h(Table, {
        columns: header.map<Column>(({ text, align }) => ({
          title: text,
          key: text,
          align: align || 'center',
          customRender: ({ value }) => h('div', { innerHTML: value }),
        })),
        dataSource: rows.map((row) => {
          const record: Record<string, any> = {}
          header.forEach(({ text }, index) => {
            record[text] = this.parser.parseInline(row[index]?.tokens || [])
          })
          return record
        }),
      })
      queueCustomComp(containerId, comp)
      return `<div id="${containerId}"></div>`
    },
  },
})

const destroyDomContainers = () => {
  domContainers.forEach((destroy) => destroy())
  domContainers.length = 0
}

const mountCustomComps = (mounts: { containerId: string; comp: VNode }[]) => {
  mounts.forEach(({ containerId, comp }) => {
    const div = document.getElementById(containerId)
    if (!div) return
    render(comp, div)
    domContainers.push(() => render(null, div))
  })
}

const renderContent = async (requestId: number) => {
  const mounts: typeof pendingMounts = []
  pendingMounts = mounts
  const nextHtml = markdownParser.parse(props.content, { async: false })

  if (requestId !== renderRequest || isUnmounted) return

  destroyDomContainers()
  html.value = nextHtml
  await nextTick()

  if (requestId !== renderRequest || isUnmounted) return

  mountCustomComps(mounts)
}

const scheduleRenderContent = () => {
  const requestId = ++renderRequest
  if (renderFrame) cancelAnimationFrame(renderFrame)
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0
    renderContent(requestId)
  })
}

onMounted(scheduleRenderContent)
onBeforeUnmount(() => {
  isUnmounted = true
  if (renderFrame) cancelAnimationFrame(renderFrame)
  destroyDomContainers()
})

watch(() => props.content, scheduleRenderContent, { flush: 'post' })
</script>

<template>
  <div v-html="html"></div>
</template>
