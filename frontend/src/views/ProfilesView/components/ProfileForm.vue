<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, inject, computed, useTemplateRef, type Ref } from 'vue'

import { useMessage, useAlert } from '@/hooks'
import { deepClone, generateConfig, sampleID } from '@/utils'
import * as Defaults from '@/constant/profile'
import { WindowToggleMaximise } from '@/bridge'
import { useProfilesStore } from '@/stores'

import GeneralConfig from './GeneralConfig.vue'
import InboundsConfig from './InboundsConfig.vue'
import OutboundsConfig from './OutboundsConfig.vue'
import RouteConfig from './RouteConfig.vue'
import DnsConfig from './DnsConfig.vue'
import MixinAndScript from './MixinAndScriptConfig.vue'

interface Props {
  id?: string
  step?: number
  isUpdate?: boolean
}

enum Step {
  Name = 0,
  General = 1,
  Inbounds = 2,
  Outbounds = 3,
  Route = 4,
  Dns = 5,
  MixinScript = 6
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false,
  step: Step.Name
})

const loading = ref(false)
const inboundsRef = useTemplateRef('inboundsRef')
const outboundsRef = useTemplateRef('outboundsRef')
const routeRef = useTemplateRef('routeRef')
const dnsRef = useTemplateRef('dnsRef')
const currentStep = ref(props.step)

const stepItems = [
  { title: 'profile.step.name' },
  { title: 'profile.step.general' },
  { title: 'profile.step.inbounds' },
  { title: 'profile.step.outbounds' },
  { title: 'profile.step.route' },
  { title: 'profile.step.dns' },
  { title: 'profile.step.mixin-script' }
]

const profile = ref<IProfile>({
  id: sampleID(),
  name: '',
  log: Defaults.DefaultLog(),
  experimental: Defaults.DefaultExperimental(),
  inbounds: Defaults.DefaultInbounds(),
  outbounds: Defaults.DefaultOutbounds(),
  route: Defaults.DefaultRoute(),
  dns: Defaults.DefaultDns(),
  mixin: Defaults.DefaultMixin(),
  script: Defaults.DefaultScript()
})

const inboundOptions = computed(() =>
  profile.value.inbounds.map((v) => ({ label: v.tag, value: v.id }))
)

const outboundOptions = computed(() =>
  profile.value.outbounds.map((v) => ({ label: v.tag, value: v.id }))
)

const serverOptions = computed(() =>
  profile.value.dns.servers.map((v) => ({ label: v.tag, value: v.id }))
)

const generalConfig = computed({
  get() {
    return { log: profile.value.log, experimental: profile.value.experimental }
  },
  set({ log, experimental }) {
    profile.value.log = log
    profile.value.experimental = experimental
  }
})

const mixinAndScriptConfig = computed({
  get() {
    return { mixin: profile.value.mixin, script: profile.value.script }
  },
  set({ mixin, script }) {
    profile.value.mixin = mixin
    profile.value.script = script
  }
})

const { t } = useI18n()
const { alert } = useAlert()
const { message } = useMessage()
const profilesStore = useProfilesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any
const handlePrevStep = () => currentStep.value--
const handleNextStep = () => currentStep.value++

const handleSave = async () => {
  loading.value = true
  try {
    if (props.isUpdate) {
      await profilesStore.editProfile(props.id, profile.value)
      handleSubmit()
    } else {
      await profilesStore.addProfile(profile.value)
      handleCancel()
    }
  } catch (error: any) {
    console.error('handleSave: ', error)
    message.error(error)
  }
  loading.value = false
}

const handleAdd = () => {
  const map: Record<number, Ref> = {
    [Step.Inbounds]: inboundsRef,
    [Step.Outbounds]: outboundsRef,
    [Step.Route]: routeRef,
    [Step.Dns]: dnsRef
  }
  map[currentStep.value].value.handleAdd()
}

const handlePreview = async () => {
  try {
    const config = await generateConfig(profile.value)
    alert(profile.value.name, JSON.stringify(config, null, 2))
  } catch (error: any) {
    message.error(error.message || error)
  }
}

if (props.isUpdate) {
  const p = profilesStore.getProfileById(props.id)
  if (p) {
    profile.value = deepClone(p)
  }
}
</script>

<template>
  <div @dblclick="WindowToggleMaximise" class="header" style="--wails-draggable: drag">
    <div class="header-title">
      {{ t(stepItems[currentStep].title) }} ({{ currentStep + 1 }} / {{ stepItems.length }})
    </div>
    <Button @click="handlePreview" icon="file" type="text" class="ml-auto" />
    <Button
      v-show="[Step.Inbounds, Step.Outbounds, Step.Route, Step.Dns].includes(currentStep)"
      @click="handleAdd"
      icon="add"
      type="text"
      class="mr-8"
    />
  </div>

  <div class="form">
    <div v-show="currentStep === Step.Name">
      <div class="form-item">
        <div class="name">{{ t('profile.name') }} *</div>
        <Input v-model="profile.name" auto-size autofocus class="flex-1 ml-8" />
      </div>
    </div>
    <div v-show="currentStep === Step.General">
      <GeneralConfig v-model="generalConfig" :outbound-options="outboundOptions" />
    </div>
    <div v-show="currentStep === Step.Inbounds">
      <InboundsConfig v-model="profile.inbounds" ref="inboundsRef" />
    </div>
    <div v-show="currentStep === Step.Outbounds">
      <OutboundsConfig v-model="profile.outbounds" ref="outboundsRef" />
    </div>
    <div v-show="currentStep === Step.Route">
      <RouteConfig
        v-model="profile.route"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
        ref="routeRef"
      />
    </div>
    <div v-show="currentStep === Step.Dns">
      <DnsConfig
        v-model="profile.dns"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :rule-set="profile.route.rule_set"
        ref="dnsRef"
      />
    </div>
    <div v-show="currentStep === Step.MixinScript">
      <MixinAndScript v-model="mixinAndScriptConfig" />
    </div>
  </div>

  <div class="form-action">
    <Button @click="handlePrevStep" :disabled="currentStep == Step.Name" type="text">
      {{ t('common.prevStep') }}
    </Button>
    <Button
      @click="handleNextStep"
      :disabled="!profile.name || currentStep == stepItems.length - 1"
      type="text"
      class="mr-auto"
    >
      {{ t('common.nextStep') }}
    </Button>
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button @click="handleSave" :loading="loading" :disabled="!profile.name" type="primary">
      {{ t('common.save') }}
    </Button>
  </div>
</template>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  margin-top: 8px;
  &-title {
    font-size: 20px;
    font-weight: bold;
    margin: 8px 0 16px 0;
  }
}
.form {
  padding-right: 8px;
  overflow-y: auto;
  max-height: calc(70vh - 8px);
}
</style>
