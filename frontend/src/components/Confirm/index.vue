<script setup lang="ts">
import { marked } from 'marked'
import { h, onMounted, ref, render, type VNode } from 'vue'

import useI18n from '@/lang'
import { APP_TITLE, APP_VERSION, sampleID } from '@/utils'

import CodeViewer from '@/components/CodeViewer/index.vue'
import Divider from '@/components/Divider/index.vue'
import Table from '@/components/Table/index.vue'
import Tag from '@/components/Tag/index.vue'

import type { Column } from '@/components/Table/index.vue'

export type ConfirmOptions = {
  type: 'text' | 'markdown'
  cancelText?: string
  okText?: string
}

interface Props {
  title: string
  message: string | Record<string, any>
  options?: ConfirmOptions
  cancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cancel: true,
  options: () => ({ type: 'text' }),
})

const emits = defineEmits(['confirm', 'cancel', 'finish'])

const content = ref<string | Record<string, any>>('')
const domContainers: (() => void)[] = []

const { t } = useI18n.global

marked.setOptions({ async: true })

marked.use({
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
      mountCustomComp(containerId, comp)
      return `<div id="${containerId}"></div>`
    },
    heading({ text, depth }) {
      return `<h${depth} style="color: var(--primary-color)"># ${text}</h${depth}>`
    },
    codespan({ text }) {
      const containerId = 'Tag_' + sampleID()
      const comp = h(Tag, { color: 'cyan', size: 'small' }, () => text)
      mountCustomComp(containerId, comp)
      return `<span id="${containerId}"></span>`
    },
    code({ text, lang }) {
      const containerId = 'CodeViewer_' + sampleID()
      const comp = h(CodeViewer, { editable: false, modelValue: text, lang: lang as any })
      mountCustomComp(containerId, comp)
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
      mountCustomComp(containerId, comp)
      return `<div id="${containerId}"></div>`
    },
  },
})

const mountCustomComp = (containerId: string, comp: VNode) => {
  let count = 0
  const tryToMount = () => {
    if (count >= 3) return
    count += 1
    const div = document.getElementById(containerId)
    if (!div) return setTimeout(tryToMount, count * 100)
    render(comp, div)
    domContainers.push(() => render(null, div))
  }
  setTimeout(tryToMount)
}

const renderContent = async () => {
  if (typeof props.message !== 'string') {
    content.value = JSON.stringify(props.message, null, 2)
    return
  }
  if (props.options.type === 'text') {
    content.value = t(props.message)
    return
  }
  content.value = await marked.parse(props.message)
}

onMounted(renderContent)

const handleConfirm = () => {
  emits('confirm', true)
  emits('finish')
  domContainers.forEach((destroy) => destroy())
}

const handleCancel = () => {
  emits('cancel')
  emits('finish')
  domContainers.forEach((destroy) => destroy())
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="gui-confirm flex flex-col p-8 rounded-8 shadow">
      <div class="font-bold break-all px-4 py-8">{{ t(title) }}</div>
      <div
        class="flex-1 overflow-y-auto text-12 leading-relaxed p-6 break-all whitespace-pre-wrap select-text"
        v-html="content"
      ></div>
      <div class="form-action gap-4">
        <Button v-if="cancel" @click="handleCancel" size="small">
          {{ t(options.cancelText || 'common.cancel') }}
        </Button>
        <Button @click="handleConfirm" size="small" type="primary">
          {{ t(options.okText || 'common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-confirm {
  min-width: 340px;
  max-width: 60%;
  background: var(--toast-bg);
}
</style>
