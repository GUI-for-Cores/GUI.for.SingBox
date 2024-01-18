<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, inject } from 'vue'

import { useMessage } from '@/hooks'
import { deepClone, ignoredError } from '@/utils'
import { Readfile, Writefile } from '@/utils/bridge'
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
    message.info('common.success')
    handleSubmit()
  } catch (error: any) {
    message.info(error)
    console.log(error)
  }
  loading.value = false
}

const initPluginCode = async (p: PluginType) => {
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
    <div class="action">
      <Button @click="handleCancel" :disable="loading">
        {{ t('common.cancel') }}
      </Button>
      <Button @click="handleSave" :loading="loading" type="primary">
        {{ t('common.save') }}
      </Button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.plugin-view {
  display: flex;
  flex-direction: column;
}
.action {
  display: flex;
  margin-top: 8px;
  justify-content: flex-end;
}
</style>
