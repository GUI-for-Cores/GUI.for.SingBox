<script setup lang="ts">
import { ref } from 'vue'

import { HttpGet, ReadFile } from '@/bridge'
import { usePluginsStore } from '@/stores'
import { ignoredError } from '@/utils'

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
      const content = (await ignoredError(ReadFile, p.path)) || ''
      code.value = content
    }
    const { body } = await HttpGet(p.url)
    code.value = body
  }
}

fetchAndUpdatePluginCode()
</script>

<template>
  <CodeViewer v-model="code" lang="javascript" mode="diff" />
</template>
