<script setup lang="ts">
import { ref, computed, inject, h, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import { ClipboardSetText, ReadFile, WriteFile } from '@/bridge'
import { DraggableOptions } from '@/constant/app'
import { useSubscribesStore } from '@/stores'
import { buildSmartRegExp, deepClone, ignoredError, message, modal, sampleID } from '@/utils'

import Button from '@/components/Button/index.vue'
import CodeEditor from '@/components/CodeEditor/index.vue'
import CodeViewer from '@/components/CodeViewer/index.vue'

interface Props {
  sub: App.Subscription
}

const props = defineProps<Props>()

const loading = ref(false)
const keywords = ref('')
const proxyType = ref('')
const allFieldsProxies = ref<any[]>([])
const sub = ref(deepClone(props.sub))

const filteredProxyTypeOptions = computed(() => {
  const proxyProtocols = sub.value.proxies.reduce((p, c) => {
    p[c.type] = (p[c.type] || 0) + 1
    return p
  }, {} as Recordable)
  return [{ label: 'All', value: '', count: 0 }].concat(
    Object.entries(proxyProtocols).map(([label, count]) => ({
      label: `${label}(${count})`,
      value: label,
      count,
    })),
  )
})

const filteredProxies = computed(() => {
  return sub.value.proxies.filter((v) => {
    const hitType = proxyType.value ? proxyType.value === v.type : true
    const hitName = buildSmartRegExp(keywords.value, 'i').test(v.tag)
    return hitName && hitType
  })
})

const menus: App.Menu[] = [
  {
    label: 'common.details',
    handler: async (record: App.Subscription['proxies'][0]) => {
      try {
        const proxy = await getProxyByTag(record.tag)
        const m = modal({
          title: 'common.details',
          cancelText: 'common.close',
          maskClosable: true,
          submit: false,
        })
        const comp = defineComponent(() => {
          return () =>
            h(CodeViewer, {
              lang: 'json',
              modelValue: JSON.stringify(proxy, null, 2),
            })
        })
        m.setContent(comp).open()
      } catch (error) {
        message.error(error)
      }
    },
  },
  {
    label: 'common.copy',
    handler: async (record: App.Subscription['proxies'][0]) => {
      try {
        const proxy = await getProxyByTag(record.tag)
        await ClipboardSetText(JSON.stringify(proxy, null, 2))
        message.success('common.copied')
      } catch (error: any) {
        message.error(error)
      }
    },
  },
  {
    label: 'common.edit',
    handler: async (record: App.Subscription['proxies'][0]) => {
      try {
        const proxy = await getProxyByTag(record.tag)
        const text = ref('')
        const m = modal({
          title: 'common.edit',
          cancelText: 'common.close',
          onOk: () => onEditEnd(record.tag, text.value),
        })
        const comp = defineComponent(() => {
          return () =>
            h(CodeEditor, {
              lang: 'json',
              editable: true,
              modelValue: JSON.stringify(proxy, null, 2),
              'onUpdate:modelValue'(val) {
                text.value = val
              },
            })
        })
        m.setContent(comp).open()
      } catch (error) {
        message.error(error)
      }
    },
  },
  {
    label: 'common.delete',
    handler: (record: Record<string, any>) => {
      const idx = sub.value.proxies.findIndex((v) => v.tag === record.tag)
      if (idx !== -1) {
        sub.value.proxies.splice(idx, 1)
      }
    },
  },
]

const { t } = useI18n()
const subscribeStore = useSubscribesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true
  try {
    const { path, proxies, id } = sub.value
    await initAllFieldsProxies()
    const filteredProxies = allFieldsProxies.value.filter((v: any) =>
      proxies.some((vv) => vv.tag === v.tag),
    )
    const sortedArray = proxies.map((v) => filteredProxies.find((vv) => vv.tag === v.tag))
    await WriteFile(path, JSON.stringify(sortedArray, null, 2))
    await subscribeStore.editSubscribe(id, sub.value)
    handleSubmit()
  } catch (error: any) {
    console.log(error)
    message.error(error)
  }
  loading.value = false
}

const handleAdd = async () => {
  const text = ref('')
  const m = modal({
    title: 'common.edit',
    cancelText: 'common.close',
    onOk: () => onEditEnd('', text.value),
  })
  const comp = defineComponent(() => {
    return () =>
      h(CodeEditor, {
        lang: 'json',
        editable: true,
        modelValue: '',
        'onUpdate:modelValue'(val) {
          text.value = val
        },
      })
  })
  m.setContent(comp).open()
}

const onEditEnd = async (id: string, text: string) => {
  let proxy: any
  try {
    proxy = JSON.parse(text)

    if (typeof proxy !== 'object') throw 'wrong format'
  } catch (error) {
    console.log(error)
    message.error(error)
    return false
  }

  await initAllFieldsProxies()

  const allFieldsProxiesIdx = allFieldsProxies.value.findIndex((v: any) => v.tag === id)
  const subProxiesIdx = sub.value.proxies.findIndex((v) => v.tag === id)

  if (allFieldsProxiesIdx !== -1 && subProxiesIdx !== -1) {
    allFieldsProxies.value.splice(allFieldsProxiesIdx, 1, proxy)
    sub.value.proxies.splice(subProxiesIdx, 1, {
      ...sub.value.proxies[subProxiesIdx]!,
      tag: proxy.tag,
    })
  } else {
    allFieldsProxies.value.push(proxy)
    sub.value.proxies.push({
      id: sampleID(),
      tag: proxy.tag,
      type: proxy.type,
    })
  }
}

const initAllFieldsProxies = async () => {
  if (allFieldsProxies.value.length) return
  const content = (await ignoredError(ReadFile, sub.value!.path)) || '[]'
  allFieldsProxies.value = JSON.parse(content)
}

const getProxyByTag = async (tag: string) => {
  await initAllFieldsProxies()
  const proxy = allFieldsProxies.value.find((v: any) => v.tag === tag)
  if (!proxy) throw 'Proxy Not Found'
  return proxy
}

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <ModalContainer :empty="filteredProxies.length === 0">
    <template #top>
      <div class="flex items-center gap-8">
        <Select v-model="proxyType" :options="filteredProxyTypeOptions" size="small" />
        <Input
          v-model="keywords"
          :placeholder="t('subscribes.proxies.name')"
          clearable
          size="small"
          class="flex-1"
        />
        <Button type="primary" size="small" @click="handleAdd">
          {{ t('subscribes.proxies.add') }}
        </Button>
      </div>
    </template>

    <template #body>
      <div v-draggable="[sub.proxies, DraggableOptions]" class="grid grid-cols-4 gap-8">
        <Card
          v-for="proxy in filteredProxies"
          :key="proxy.tag"
          v-menu="menus.map((v) => ({ ...v, handler: () => v.handler?.(proxy) }))"
          :title="proxy.tag"
        >
          <div class="text-12">
            {{ proxy.type }}
          </div>
        </Card>
      </div>
    </template>
  </ModalContainer>
</template>
