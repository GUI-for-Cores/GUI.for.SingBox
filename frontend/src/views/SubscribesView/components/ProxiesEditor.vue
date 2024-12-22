<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { Readfile, Writefile } from '@/bridge'
import { deepClone, ignoredError, omitArray, sampleID } from '@/utils'
import { type SubscribeType, useSubscribesStore } from '@/stores'

interface Props {
  sub: SubscribeType
}

const props = defineProps<Props>()

const loading = ref(false)
const proxiesText = ref('')
const sub = ref(deepClone(props.sub))

const { t } = useI18n()
const { message } = useMessage()
const subscribeStore = useSubscribesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true
  try {
    const { path, proxies, id } = sub.value
    const proxiesWithId: Record<string, any>[] = JSON.parse(proxiesText.value)
    sub.value.proxies = proxiesWithId.map((v) => ({
      id: proxies.find((proxy) => proxy.id === v.__id_in_gui)?.id || sampleID(),
      tag: v.tag,
      type: v.type,
    }))
    await Writefile(path, JSON.stringify(omitArray(proxiesWithId, ['__id_in_gui']), null, 2))
    await subscribeStore.editSubscribe(id, sub.value)
    handleSubmit()
  } catch (error: any) {
    console.log(error)

    message.error(error.message || error)
  }
  loading.value = false
}

const initProxiesText = async () => {
  const content = (await ignoredError(Readfile, sub.value.path)) || '[]'
  const proxies: SubscribeType['proxies'] = JSON.parse(content)
  const proxiesWithId = proxies.map((proxy) => {
    return {
      __id_in_gui: sub.value.proxies.find((v) => v.tag === proxy.tag)?.id || sampleID(),
      ...proxy,
    }
  })
  proxiesText.value = JSON.stringify(proxiesWithId, null, 2)
}

initProxiesText()
</script>

<template>
  <div class="proxies-view">
    <CodeViewer v-model="proxiesText" lang="javascript" editable class="code" />
    <div class="form-action">
      <Button @click="handleCancel" :disabled="loading">
        {{ t('common.cancel') }}
      </Button>
      <Button @click="handleSave" :loading="loading" type="primary">
        {{ t('common.save') }}
      </Button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.proxies-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.code {
  flex: 1;
  overflow-y: auto;
}
</style>
