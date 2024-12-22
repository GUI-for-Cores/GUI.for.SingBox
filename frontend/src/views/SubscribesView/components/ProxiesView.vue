<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, inject } from 'vue'

import { useBool, useMessage } from '@/hooks'
import { deepClone, ignoredError, sampleID } from '@/utils'
import { DraggableOptions } from '@/constant/app'
import { ClipboardSetText, Readfile, Writefile } from '@/bridge'
import { type SubscribeType, useSubscribesStore } from '@/stores'

interface Props {
  sub: SubscribeType
}

const props = defineProps<Props>()

let editId = ''
const isEdit = ref(false)
const loading = ref(false)
const keywords = ref('')
const proxyType = ref('')
const details = ref()
const allFieldsProxies = ref<any[]>([])
const sub = ref(deepClone(props.sub))

const [showDetails, toggleDetails] = useBool(false)

const keywordsRegexp = computed(() => {
  try {
    return new RegExp(keywords.value, 'i')
  } catch {
    return keywords.value
  }
})

const filteredProxyTypeOptions = computed(() => {
  return []
  // const protocolList = ProxyTypeOptions.map((v) => {
  //   const count = sub.value.proxies.filter((vv) => vv.type === v.value).length
  //   return { ...v, label: v.label + `(${count})`, count }
  // }).filter((v) => v.count)
  // return [{ label: 'All', value: '', count: 0 }].concat(protocolList)
})

const filteredProxies = computed(() => {
  return sub.value.proxies.filter((v) => {
    const hitType = proxyType.value ? proxyType.value === v.type : true
    let hitName = true
    if (typeof keywordsRegexp.value === 'string') {
      hitName = v.tag.toLowerCase().includes(keywordsRegexp.value.toLowerCase())
    } else {
      hitName = keywordsRegexp.value.test(v.tag)
    }
    return hitName && hitType
  })
})

const menus: Menu[] = [
  {
    label: 'common.details',
    handler: async (record: SubscribeType['proxies'][0]) => {
      try {
        const proxy = await getProxyByTag(record.tag)
        details.value = JSON.stringify(proxy, null, 2)
        isEdit.value = false
        toggleDetails()
      } catch (error: any) {
        message.error(error)
      }
    }
  },
  {
    label: 'common.copy',
    handler: async (record: SubscribeType['proxies'][0]) => {
      try {
        const proxy = await getProxyByTag(record.tag)
        await ClipboardSetText(JSON.stringify(proxy, null, 2))
        message.success('common.copied')
      } catch (error: any) {
        message.error(error)
      }
    }
  },
  {
    label: 'common.edit',
    handler: async (record: SubscribeType['proxies'][0]) => {
      try {
        const proxy = await getProxyByTag(record.tag)
        details.value = JSON.stringify(proxy, null, 2)
        isEdit.value = true
        editId = record.tag
        toggleDetails()
      } catch (error: any) {
        message.error(error)
      }
    }
  },
  {
    label: 'common.delete',
    handler: (record: Record<string, any>) => {
      const idx = sub.value.proxies.findIndex((v) => v.tag === record.tag)
      if (idx !== -1) {
        sub.value.proxies.splice(idx, 1)
      }
    }
  }
]

const { t } = useI18n()
const { message } = useMessage()
const subscribeStore = useSubscribesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true
  try {
    const { path, proxies, id } = sub.value
    await initAllFieldsProxies()
    const filteredProxies = allFieldsProxies.value.filter((v: any) =>
      proxies.some((vv) => vv.tag === v.tag)
    )
    const sortedArray = proxies.map((v) => filteredProxies.find((vv) => vv.tag === v.tag))
    await Writefile(path, JSON.stringify(sortedArray, null, 2))
    await subscribeStore.editSubscribe(id, sub.value)
    handleSubmit()
  } catch (error: any) {
    console.log(error)
    message.error(error)
  }
  loading.value = false
}

const handleAdd = async () => {
  editId = ''
  details.value = ''
  isEdit.value = true
  toggleDetails()
}

const onEditEnd = async () => {
  let proxy: any
  try {
    proxy = JSON.parse(details.value)

    if (typeof proxy !== 'object') throw 'wrong format'
  } catch (error: any) {
    console.log(error)
    message.error(error.message || error)
    // reopen
    toggleDetails()
    return
  }

  await initAllFieldsProxies()

  const allFieldsProxiesIdx = allFieldsProxies.value.findIndex((v: any) => v.tag === editId)
  const subProxiesIdx = sub.value.proxies.findIndex((v) => v.tag === editId)

  if (allFieldsProxiesIdx !== -1 && subProxiesIdx !== -1) {
    allFieldsProxies.value.splice(allFieldsProxiesIdx, 1, proxy)
    sub.value.proxies.splice(subProxiesIdx, 1, {
      ...sub.value.proxies[subProxiesIdx],
      tag: proxy.tag
    })
  } else {
    allFieldsProxies.value.push(proxy)
    sub.value.proxies.push({
      id: sampleID(),
      tag: proxy.tag,
      type: proxy.type
    })
  }
}

const initAllFieldsProxies = async () => {
  if (allFieldsProxies.value.length) return
  const content = (await ignoredError(Readfile, sub.value!.path)) || '{}'
  allFieldsProxies.value = JSON.parse(content)
}

const getProxyByTag = async (tag: string) => {
  await initAllFieldsProxies()
  const proxy = allFieldsProxies.value.find((v: any) => v.tag === tag)
  if (!proxy) throw 'Proxy Not Found'
  return proxy
}
</script>

<template>
  <div class="proxies-view">
    <div class="form">
      <span class="label">
        {{ t('subscribes.proxies.type') }}
        :
      </span>
      <Select v-model="proxyType" :options="filteredProxyTypeOptions" size="small" />
      <Input
        v-model="keywords"
        :placeholder="t('subscribes.proxies.name')"
        clearable
        size="small"
        class="ml-8 flex-1"
      />
      <Button @click="handleAdd" type="primary" size="small">
        {{ t('subscribes.proxies.add') }}
      </Button>
    </div>

    <Empty v-if="filteredProxies.length === 0" class="flex-1" />

    <div v-else v-draggable="[sub.proxies, DraggableOptions]" class="proxies">
      <Card
        v-for="proxy in filteredProxies"
        :key="proxy.tag"
        :title="proxy.tag"
        v-menu="menus.map((v) => ({ ...v, handler: () => v.handler?.(proxy) }))"
        class="proxy"
      >
        {{ proxy.type }}
      </Card>
    </div>
    <div class="form-action">
      <Button @click="handleCancel" :disabled="loading">
        {{ t('common.cancel') }}
      </Button>
      <Button @click="handleSave" :loading="loading" type="primary">
        {{ t('common.save') }}
      </Button>
    </div>
  </div>

  <Modal
    v-model:open="showDetails"
    :submit="isEdit"
    :cancel="isEdit"
    :mask-closable="!isEdit"
    :title="isEdit ? (details ? 'common.edit' : 'common.add') : 'common.details'"
    @ok="onEditEnd"
    cancel-text="common.close"
    max-height="80"
    max-width="80"
  >
    <CodeViewer v-model="details" lang="json" :editable="isEdit" />
  </Modal>
</template>

<style lang="less" scoped>
.proxies-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.form {
  display: flex;
  align-items: center;
  .label {
    padding-right: 8px;
    font-size: 12px;
  }
}
.proxies {
  margin-top: 8px;
  flex: 1;
  overflow-y: auto;

  .proxy {
    display: inline-block;
    width: calc(25% - 4px);
    margin: 2px;
  }
}
</style>
