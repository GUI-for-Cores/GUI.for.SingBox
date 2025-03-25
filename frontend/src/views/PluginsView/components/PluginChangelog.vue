<script setup lang="ts">
import { ref } from 'vue'

import { HttpGet, Readfile } from '@/bridge'
import { ignoredError } from '@/utils'
import { usePluginsStore } from '@/stores'

interface Props {
  id: string
}

const props = defineProps<Props>()

const code = ref('')

const pluginsStore = usePluginsStore()

const fetchAndUpdatePluginCode = async () => {
  const p = pluginsStore.getPluginById(props.id)
  if (p) {
    const _code = pluginsStore.getPluginCodefromCache(p.id)
    if (_code) {
      code.value = _code
    } else {
      const content = (await ignoredError(Readfile, p.path)) || ''
      code.value = content
    }
    const { body } = await HttpGet(p.url)
    code.value = body
  }
}

fetchAndUpdatePluginCode()
</script>

<template>
  <div class="plugin-view">
    <CodeViewer v-model="code" lang="javascript" mode="diff" />
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
