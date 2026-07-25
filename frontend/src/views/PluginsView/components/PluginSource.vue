<script lang="ts" setup>
import { h } from 'vue'

import { DefaultPluginHubSources } from '@/constant/app'
import useI18n from '@/lang'
import { useAppSettingsStore } from '@/stores'

import Button from '@/components/Button/index.vue'

const { t } = useI18n.global
const appSettingsStore = useAppSettingsStore()

const handleAddSource = () => {
  appSettingsStore.app.plugins.sources.push({ enable: false, name: '', url: '' })
}

const handleRemoveSource = (index: number) => {
  appSettingsStore.app.plugins.sources.splice(index, 1)
}

const restoreDefaultSources = () => {
  appSettingsStore.app.plugins.sources = DefaultPluginHubSources()
}

defineExpose({
  modalSlots: {
    action: () =>
      h(
        Button,
        {
          type: 'link',
          class: 'mr-auto',
          onClick: restoreDefaultSources,
        },
        () => t('plugin.restore'),
      ),
  },
})
</script>

<template>
  <Empty v-if="appSettingsStore.app.plugins.sources.length == 0" />
  <div class="flex flex-col gap-8">
    <Card v-for="(source, index) in appSettingsStore.app.plugins.sources" :key="index">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="handleRemoveSource(index)" />
      </template>
      <template #title-prefix>
        <div class="flex items-center gap-8 font-bold">
          <Switch v-model="source.enable" border="square" />
          <Input v-model="source.name" editable />
        </div>
      </template>
      <Input v-model="source.url" class="w-full" placeholder="https://" />
    </Card>
    <Button icon="add" class="w-full" type="primary" @click="handleAddSource" />
  </div>
</template>
