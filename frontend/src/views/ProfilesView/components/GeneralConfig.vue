<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { type ProfileType } from '@/stores'
import { ModeOptions, LogLevelOptions, GeneralConfigDefaults } from '@/constant'

const fields = defineModel<ProfileType['generalConfig']>({ default: GeneralConfigDefaults() })

const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.mode') }}
    <Radio v-model="fields.mode" :options="ModeOptions" />
  </div>
  <div class="form-item" v-if="false">
    {{ t('kernel.log-level') }}
    <Radio v-model="fields['log-level']" :options="LogLevelOptions" />
  </div>
  <div class="form-item">
    {{ t('kernel.allow-lan') }}
    <Switch v-model="fields['allow-lan']" />
  </div>
  <div class="form-item">
    {{ t('kernel.interface-name') }}
    <InterfaceSelect v-model="fields['interface-name']" />
  </div>
  <div class="form-item">
    {{ t('kernel.mixed-port') }}
    <Input v-model="fields['mixed-port']" :min="0" :max="65535" type="number" editable />
  </div>
</template>

<style lang="less" scoped></style>
