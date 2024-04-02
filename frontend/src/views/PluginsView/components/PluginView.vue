<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, inject } from 'vue'

import { useMessage } from '@/hooks'
import { Readfile, Writefile } from '@/bridge'
import { deepClone, ignoredError } from '@/utils'
import { usePluginsStore, type PluginType } from '@/stores'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const plugin = ref<PluginType>()
const code = ref('')

const { t } = useI18n()
const { message } = useMessage()
const pluginsStore = usePluginsStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  if (!plugin.value) return
  loading.value = true
  try {
    await Writefile(plugin.value.path, code.value)
    await pluginsStore.reloadPlugin(plugin.value, code.value)
    handleSubmit()
  } catch (error: any) {
    message.error(error)
    console.log(error)
  }
  loading.value = false
}

const initPluginCode = async (p: PluginType) => {
  const _code = pluginsStore.getPluginCodefromCache(p.id)
  if (_code) {
    code.value = _code
    return
  }
  const content = (await ignoredError(Readfile, p.path)) || ''
  code.value = content
}

const p = pluginsStore.getPluginById(props.id)
if (p) {
  plugin.value = deepClone(p)
  initPluginCode(p)
}
</script>

<template>
  <div class="plugin-view">
    <CodeViewer v-model="code" lang="javascript" editable />
  </div>
  <div class="form-action">
    <Button @click="handleCancel" :disable="loading">
      {{ t('common.cancel') }}
    </Button>
    <Button @click="handleSave" :loading="loading" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.plugin-view {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  overflow-y: auto;
  max-height: 70vh;
}
</style>
