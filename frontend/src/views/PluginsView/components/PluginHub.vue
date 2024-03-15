<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { HttpGet, Readfile, Writefile } from '@/bridge'
import { APP_TITLE, APP_VERSION, ignoredError } from '@/utils'
import { usePluginsStore, type PluginType, useAppSettingsStore } from '@/stores'

const loading = ref(false)
const list = ref<PluginType[]>([])
const cacheFile = 'data/.cache/plugin-list.json'
const hubUrl =
  'https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/generic.json'
const gfcUrl = 'https://raw.githubusercontent.com/GUI-for-Cores/Plugin-Hub/main/plugins/gfc.json'

const { t } = useI18n()
const { message } = useMessage()
const pluginsStore = usePluginsStore()
const appSettings = useAppSettingsStore()

const updateList = async () => {
  loading.value = true
  const userAgent = appSettings.app.userAgent || APP_TITLE + '/' + APP_VERSION
  try {
    const { body: body1 } = await HttpGet(hubUrl, { 'User-Agent': userAgent })
    const { body: body2 } = await HttpGet(gfcUrl, { 'User-Agent': userAgent })
    const list1 = JSON.parse(body1)
    const list2 = JSON.parse(body2)
    list.value = [...list1, ...list2]
    await Writefile(cacheFile, JSON.stringify([...list1, ...list2]))
    message.success('plugins.updateSuccess')
  } catch (error: any) {
    message.error(error)
  }
  loading.value = false
}

const getList = async () => {
  const body = await ignoredError(Readfile, cacheFile)
  if (body) {
    list.value = JSON.parse(body)
    return
  }

  updateList()
}

const handleAddPlugin = async (plugin: PluginType) => {
  try {
    await pluginsStore.addPlugin(plugin)
    const { id } = message.info('plugins.updating')
    await pluginsStore.updatePlugin(plugin.id)
    message.update(id, 'common.success', 'success')
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  }
}

const isAlreadyAdded = (id: string) => pluginsStore.getPluginById(id)

getList()
</script>

<template>
  <div class="plugin-hub">
    <div v-if="loading" class="loading">
      <Button type="text" loading></Button>
    </div>
    <template v-else>
      <div class="header">
        <Button type="text">{{ t('plugins.total') }} : {{ list.length }}</Button>
        <Button @click="updateList" type="link" class="ml-auto">
          {{ t('plugins.update') }}
        </Button>
      </div>
      <Card v-for="plugin in list" :key="plugin.id" :title="plugin.name" class="plugin-item">
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

.ml-auto {
  margin-left: auto;
}
</style>
