<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { sleep } from '@/utils'
import { usePluginsStore, type PluginType } from '@/stores'

const { t } = useI18n()
const { message } = useMessage()
const pluginsStore = usePluginsStore()

const handleAddPlugin = async (plugin: PluginType) => {
  const { success, error, destroy } = message.info('plugins.updating', 60 * 1000)
  try {
    await pluginsStore.addPlugin(plugin)
    success('common.success')
  } catch (err: any) {
    error(err.message || err)
  } finally {
    sleep(1000).then(destroy)
  }
}

const handleUpdatePluginHub = async () => {
  try {
    await pluginsStore.updatePluginHub()
    message.success('plugins.updateSuccess')
  } catch (err: any) {
    message.error(err.message || err)
  }
}

const isAlreadyAdded = (id: string) => pluginsStore.getPluginById(id)
</script>

<template>
  <div class="plugin-hub">
    <div v-if="pluginsStore.pluginHubLoading" class="loading">
      <Button type="text" loading></Button>
    </div>
    <template v-else>
      <div class="header">
        <Button type="text">{{ t('plugins.total') }} : {{ pluginsStore.pluginHub.length }}</Button>
        <Button @click="handleUpdatePluginHub" type="link" class="ml-auto">
          {{ t('plugins.update') }}
        </Button>
      </div>
      <Card
        v-for="plugin in pluginsStore.pluginHub"
        :key="plugin.id"
        :title="plugin.name"
        class="plugin-item"
      >
        <div v-tips="plugin.description" class="description">{{ plugin.description }}</div>
        <div class="action">
          <Button v-if="isAlreadyAdded(plugin.id)" type="text" size="small">
            {{ t('common.added') }}
          </Button>
          <Button v-else @click="handleAddPlugin(plugin)" type="link" size="small">
            {{ t('common.add') }}
          </Button>
        </div>
      </Card>
    </template>
  </div>
</template>

<style lang="less" scoped>
.plugin-hub {
  height: 100%;

  .plugin-item {
    display: inline-block;
    margin: 4px;
    font-size: 12px;
    width: calc(33.333% - 8px);

    .description {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .action {
      text-align: right;
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
  height: 98%;
}

.header {
  display: flex;
  align-items: center;
}
</style>
