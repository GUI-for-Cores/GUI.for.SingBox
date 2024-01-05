<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils'
import { StackOptions } from '@/constant'
import { type ProfileType } from '@/stores'

interface Props {
  modelValue: ProfileType['tunConfig']
}

const props = withDefaults(defineProps<Props>(), {})

const emits = defineEmits(['update:modelValue'])

const fields = ref(deepClone(props.modelValue))

const { t } = useI18n()

watch(fields, (v) => emits('update:modelValue', v), { immediate: true, deep: true })
</script>

<template>
  <div class="form-item">
    {{ t('kernel.tun.enable') }}
    <Switch v-model="fields.enable" />
  </div>
  <template v-if="fields.enable">
    <div class="form-item">
      {{ t('kernel.tun.stack') }}
      <Radio v-model="fields.stack" :options="StackOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.auto-route') }}
      <Switch v-model="fields['auto-route']" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.interface_name') }}
      <Input v-model="fields['interface_name']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.mtu') }}
      <Input v-model="fields['mtu']" type="number" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.strict-route') }}
      <Switch v-model="fields['strict-route']" />
    </div>
    <div class="form-item">
      {{ t('kernel.tun.endpoint-independent-nat') }}
      <Switch v-model="fields['endpoint-independent-nat']" />
    </div>
  </template>
</template>

<style lang="less" scoped>
.flex-start {
  align-items: flex-start;
}
</style>
