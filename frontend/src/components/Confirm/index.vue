<script setup lang="ts">
import { h, onMounted, ref, render } from 'vue'
import { marked } from 'marked'

import useI18n from '@/lang'
import { APP_TITLE, APP_VERSION, sampleID } from '@/utils'
import CodeViewer from '@/components/CodeViewer/index.vue'
import Divider from '@/components/Divider/index.vue'

export type Options = {
  type: 'text' | 'markdown'
}

interface Props {
  title: string
  message: string | Record<string, any>
  options?: Options
  cancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cancel: true,
  options: () => ({ type: 'text' })
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
      setTimeout(() => {
        const div = document.getElementById(containerId)
        if (!div) return
        render(comp, div)
        domContainers.push(() => render(null, div))
      })
      return `<div id="${containerId}"></div>`
    },
    code({ text, lang }) {
      const containerId = 'CodeViewer_' + sampleID()
      const comp = h(CodeViewer, { editable: false, modelValue: text, lang: lang as any })
      setTimeout(() => {
        const div = document.getElementById(containerId)
        if (!div) return
        render(comp, div)
        domContainers.push(() => render(null, div))
      })
      return `<div id="${containerId}"></div>`
    }
  }
})

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
    <div class="confirm">
      <div class="title">{{ t(title) }}</div>
      <div class="message select-text" v-html="content"></div>
      <div class="form-action">
        <Button v-if="cancel" @click="handleCancel" size="small">{{ t('common.cancel') }}</Button>
        <Button @click="handleConfirm" size="small" type="primary">
          {{ t('common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.confirm {
  min-width: 340px;
  max-width: 60%;
  padding: 8px;
  background: var(--toast-bg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  flex-direction: column;

  .title {
    font-weight: bold;
    padding: 8px 4px;
    word-break: break-all;
  }
  .message {
    font-size: 12px;
    line-height: 1.6;
    padding: 6px;
    word-break: break-all;
    white-space: pre-wrap;
    overflow-y: auto;
    flex: 1;
  }
}
</style>
