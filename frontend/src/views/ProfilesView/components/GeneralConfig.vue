<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { ModeOptions, LogLevelOptions } from '@/constant/kernel'
import { useBool } from '@/hooks'
import { generateSecureKey } from '@/utils'

interface Props {
  outboundOptions: { label: string; value: string }[]
}

defineProps<Props>()

const model = defineModel<{ log: IProfile['log']; experimental: IProfile['experimental'] }>({
  required: true,
})

const { t } = useI18n()
const [showMore, toggleMore] = useBool(false)
</script>

<template>
  <div>
    <div class="form-item">
      {{ t('kernel.clash_api.default_mode') }}
      <Radio v-model="model.experimental.clash_api.default_mode" :options="ModeOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.log.disabled') }}
      <Switch v-model="model.log.disabled" />
    </div>
    <template v-if="!model.log.disabled">
      <div class="form-item">
        {{ t('kernel.log.level') }}
        <Radio v-model="model.log.level" :options="LogLevelOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.log.output') }}
        <Input v-model="model.log.output" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.log.timestamp') }}
        <Switch v-model="model.log.timestamp" />
      </div>
    </template>
    <div class="form-item">
      {{ t('kernel.clash_api.external_controller') }}
      <Input v-model="model.experimental.clash_api.external_controller" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.clash_api.secret') }}
      <div class="flex items-center">
        <Input v-model="model.experimental.clash_api.secret" editable>
          <template #suffix>
            <Button
              type="text"
              size="small"
              icon="refresh"
              @click="() => (model.experimental.clash_api.secret = generateSecureKey())"
            />
          </template>
        </Input>
      </div>
    </div>
    <Divider>
      <Button type="text" size="small" @click="toggleMore">{{ t('common.more') }}</Button>
    </Divider>
    <div v-show="showMore">
      <div class="form-item">
        {{ t('kernel.clash_api.external_ui') }}
        <Input v-model="model.experimental.clash_api.external_ui" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.clash_api.external_ui_download_url') }}
        <Input v-model="model.experimental.clash_api.external_ui_download_url" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.clash_api.external_ui_download_detour') }}
        <Select
          v-model="model.experimental.clash_api.external_ui_download_detour"
          :options="outboundOptions"
          clearable
        />
      </div>
      <div class="form-item">
        {{ t('kernel.clash_api.access_control_allow_private_network') }}
        <Switch v-model="model.experimental.clash_api.access_control_allow_private_network" />
      </div>
      <div
        :class="{
          'items-start': model.experimental.clash_api.access_control_allow_origin.length !== 0,
        }"
        class="form-item"
      >
        {{ t('kernel.clash_api.access_control_allow_origin') }}
        <InputList v-model="model.experimental.clash_api.access_control_allow_origin" />
      </div>
      <div class="form-item">
        {{ t('kernel.cache_file.enabled') }}
        <Switch v-model="model.experimental.cache_file.enabled" />
      </div>
      <template v-if="model.experimental.cache_file.enabled">
        <div class="form-item">
          {{ t('kernel.cache_file.path') }}
          <Input v-model="model.experimental.cache_file.path" editable />
        </div>
        <div class="form-item">
          {{ t('kernel.cache_file.cache_id') }}
          <Input v-model="model.experimental.cache_file.cache_id" editable />
        </div>
        <div class="form-item">
          {{ t('kernel.cache_file.store_fakeip') }}
          <Switch v-model="model.experimental.cache_file.store_fakeip" />
        </div>
        <div class="form-item">
          {{ t('kernel.cache_file.store_rdrc') }}
          <Switch v-model="model.experimental.cache_file.store_rdrc" />
        </div>
      </template>
    </div>
  </div>
</template>
