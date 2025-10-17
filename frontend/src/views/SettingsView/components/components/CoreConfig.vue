<script lang="ts" setup>
import { h, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { DraggableOptions } from '@/constant/app'
import { DefaultCoreConfig } from '@/constant/kernel'
import { useAppSettingsStore } from '@/stores'
import { deepClone, message, processMagicVariables } from '@/utils'

import Button from '@/components/Button/index.vue'

interface Props {
  isAlpha: boolean
}

const props = defineProps<Props>()

const tabs = [
  { tab: 'settings.kernel.config.env', key: 'env' },
  { tab: 'settings.kernel.config.args', key: 'args' },
]

const activeKey = ref('env')
const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const { t } = useI18n()
const appSettings = useAppSettingsStore()

const source = props.isAlpha ? appSettings.app.kernel.alpha : appSettings.app.kernel.main

const model = ref(deepClone(source))

const handleSave = () => {
  Object.assign(source, model.value)
  handleSubmit()
}

const modalSlots = {
  action: () =>
    h(
      Button,
      {
        type: 'link',
        class: 'mr-auto',
        onClick: () => {
          const { env, args } = DefaultCoreConfig()
          model.value.env = env
          model.value.args = args
          message.success('common.success')
        },
      },
      () => t('plugin.restore'),
    ),
  cancel: () =>
    h(
      Button,
      {
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <div>
    <Tabs v-model:active-key="activeKey" :items="tabs">
      <template #env>
        <Empty v-if="Object.keys(model.env).length === 0" />
        <Card v-else :title="t('common.preview')">
          <div class="flex flex-col gap-4">
            <div
              v-for="[key, value] in Object.entries(model.env)"
              :key="key"
              class="flex items-center"
            >
              <Tag class="w-[25%] self-stretch">
                <div
                  class="h-full flex items-center justify-center py-2 break-all whitespace-pre-wrap"
                >
                  {{ key }}
                </div>
              </Tag>
              :
              <Tag class="w-[75%] self-stretch">
                <div
                  class="h-full flex items-center justify-center py-2 break-all whitespace-pre-wrap"
                >
                  {{ processMagicVariables(value) }}
                </div>
              </Tag>
            </div>
          </div>
        </Card>
        <KeyValueEditor v-model="model.env" class="mt-16" />
      </template>

      <template #args>
        <Empty v-if="model.args.length === 0" />
        <Card v-else :title="t('common.preview')">
          <div v-draggable="[model.args, DraggableOptions]" class="flex flex-wrap items-center">
            <div v-for="item in model.args" :key="item">
              <Tag size="small">
                <div class="py-2 break-all whitespace-pre-wrap">
                  {{ processMagicVariables(item) }}
                </div>
              </Tag>
            </div>
          </div>
        </Card>
        <InputList v-model="model.args" class="mt-16" />
      </template>
    </Tabs>
  </div>
</template>
