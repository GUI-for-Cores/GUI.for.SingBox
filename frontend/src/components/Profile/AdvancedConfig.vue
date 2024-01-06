<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils'
import { type ProfileType } from '@/stores'
import { GlobalClientFingerprintOptions } from '@/constant'

interface Props {
  modelValue: ProfileType['advancedConfig']
  profile: ProfileType
}

const props = withDefaults(defineProps<Props>(), {})

const emits = defineEmits(['update:modelValue'])

const fields = ref(deepClone(props.modelValue))

const { t } = useI18n()

watch(fields, (v) => emits('update:modelValue', v), { immediate: true, deep: true })
</script>

<template>
  <div class="form-item">
    {{ t('kernel.port') }}
    <Input v-model="fields.port" :min="0" :max="65535" type="number" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.socks-port') }}
    <Input v-model="fields['socks-port']" :min="0" :max="65535" type="number" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.external-controller') }}
    <Input v-model="fields['external-controller']" placeholder="127.0.0.1:9090" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.secret') }}
    <Input v-model="fields.secret" editable />
  </div>
  <div
    v-show="props.profile.generalConfig['allow-lan']"
    :class="{ 'flex-start': fields['lan-allowed-ips'].length !== 0 }"
    class="form-item"
  >
    {{ t('kernel.lan-allowed-ips') }}
    <InputList v-model="fields['lan-allowed-ips']" placeholder="127.0.0.1/8" />
  </div>
  <div
    v-show="props.profile.generalConfig['allow-lan']"
    :class="{ 'flex-start': fields['lan-disallowed-ips'].length !== 0 }"
    class="form-item"
  >
    {{ t('kernel.lan-disallowed-ips') }}
    <InputList v-model="fields['lan-disallowed-ips']" placeholder="192.168.0.3/32" />
  </div>
  <div class="form-item">
    {{ t('kernel.external-ui') }}
    <Input v-model="fields['external-ui']" placeholder="ui" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.external-ui-url') }}
    <Input v-model="fields['external-ui-url']" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.store-cache') }}
    <Switch v-model="fields.profile['store-cache']" />
  </div>
  <div class="form-item">
    {{ t('kernel.store-fake-ip') }}
    <Switch v-model="fields.profile['store-fake-ip']" />
  </div>
  <div class="form-item">
    {{ t('kernel.tcp-multi-path') }}
    <Switch v-model="fields['tcp-multi-path']" />
  </div>
</template>

<style lang="less" scoped>
.flex-start {
  align-items: flex-start;
}
</style>
