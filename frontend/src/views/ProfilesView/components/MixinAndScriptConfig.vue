<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DefaultMixin, DefaultScript } from '@/constant/profile'

const model = defineModel<{
  mixin: IProfile['mixin']
  script: IProfile['script']
}>({
  default: {
    mixin: DefaultMixin(),
    script: DefaultScript()
  }
})

const { t } = useI18n()

const activeTab = ref('mixin')

const tabItems = [
  { key: 'mixin', tab: 'profile.mixinSettings.name' },
  { key: 'script', tab: 'profile.scriptSettings.name' }
]

const MixinPriorityOptions = [
  { label: 'profile.mixinSettings.mixin', value: 'mixin' },
  { label: 'profile.mixinSettings.gui', value: 'gui' }
]
</script>

<template>
  <Tabs v-model:active-key="activeTab" :items="tabItems">
    <template #mixin>
      <div class="form-item">
        {{ t('profile.mixinSettings.priority') }}
        <Radio v-model="model.mixin.priority" :options="MixinPriorityOptions" />
      </div>
      <CodeViewer v-model="model.mixin.config" lang="json" editable />
    </template>
    <template #script>
      <CodeViewer v-model="model.script.code" lang="javascript" editable />
    </template>
  </Tabs>
</template>

<style lang="less" scoped></style>
