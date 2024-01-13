<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils'
import { type ProfileType } from '@/stores'
import { DomainStrategyOptions, FinalDnsOptions } from '@/constant'

interface Props {
  modelValue: ProfileType['dnsConfig'],
  proxyGroups: ProfileType['proxyGroupsConfig']
}

const props = withDefaults(defineProps<Props>(), {})

const emits = defineEmits(['update:modelValue'])

const fields = ref(deepClone(props.modelValue))

const { t } = useI18n()

const proxyOptions = computed(() => [
  ...props.proxyGroups.map(({ tag }) => ({ label: tag, value: tag })),
  { label: 'direct', value: 'direct' },
  { label: 'block', value: 'block' },
  { label:  t('kernel.dns.default'), value: '' }
])

watch(fields, (v) => emits('update:modelValue', v), { immediate: true, deep: true })
</script>

<template>
  <div class="form-item">
    {{ t('kernel.dns.enable') }}
    <Switch v-model="fields.enable" />
  </div>
  <template v-if="fields.enable">
    <div class="form-item">
      {{ t('kernel.dns.local-dns') }}
      <Input v-model="fields['local-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.remote-dns') }}
      <Input v-model="fields['remote-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.resolver-dns') }}
      <Input v-model="fields['resolver-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.remote-resolver-dns') }}
      <Input v-model="fields['remote-resolver-dns']" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.final-dns') }}
      <Select
        v-model="fields['final-dns']"
        :options="FinalDnsOptions"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.remote-dns-detour') }}
      <Select
        v-model="fields['remote-dns-detour']"
        :options="proxyOptions"
      />
    </div>
    <div class="form-item">
      {{ t('kernel.dns.strategy.name') }}
      <Select
        v-model="fields['strategy']"
        :options="DomainStrategyOptions"
      />
    </div>
  
    <div class="form-item">
      Fake-IP
      <Switch v-model="fields['fakeip']" />
    </div>
    <div v-if="fields['fakeip']">
      <div class="form-item">
        {{ t('kernel.dns.fake-ip-range-v4') }}
        <Input v-model="fields['fake-ip-range-v4']" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.fake-ip-range-v6') }}
        <Input v-model="fields['fake-ip-range-v6']" editable />
      </div>
      <div class="form-item" :class="{ 'flex-start': fields['fake-ip-filter'].length !== 0 }">
        {{ t('kernel.dns.fake-ip-filter') }}
        <InputList v-model="fields['fake-ip-filter']" />
      </div>
    </div>
  </template>
</template>

<style lang="less" scoped>
.flex-start {
  align-items: flex-start;
}
</style>
