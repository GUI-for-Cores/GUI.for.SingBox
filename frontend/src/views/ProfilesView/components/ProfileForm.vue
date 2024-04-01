<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone, sampleID, toggleFullScreen } from '@/utils'
import { useMessage, useBool } from '@/hooks'
import * as Defaults from '@/constant/profile'
import { type ProfileType, useProfilesStore } from '@/stores'

import GeneralConfig from '@/components/Profile/GeneralConfig.vue'
import AdvancedConfig from '@/components/Profile/AdvancedConfig.vue'
import TunConfig from '@/components/Profile/TunConfig.vue'
import DnsConfig from '@/components/Profile/DnsConfig.vue'
import ProxyGroupsConfig from '@/components/Profile/ProxyGroupsConfig.vue'
import DnsRulesConfig from '@/components/Profile/DnsRulesConfig.vue'
import RulesConfig from '@/components/Profile/RulesConfig.vue'

interface Props {
  id?: string
  step?: number
  isUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  isUpdate: false,
  step: 0
})

const groupsRef = ref()
const rulesRef = ref()
const dnsRulesRef = ref()
const currentStep = ref(props.step)

const stepItems = [
  { title: 'profile.step.name' },
  { title: 'profile.step.general' },
  { title: 'profile.step.tun' },
  { title: 'profile.step.groups' },
  { title: 'profile.step.rules' },
  { title: 'profile.step.dns' },
  { title: 'profile.step.dnsRules' }
]

const profile = ref<ProfileType>({
  id: sampleID(),
  name: '',
  generalConfig: Defaults.GeneralConfigDefaults(),
  advancedConfig: Defaults.AdvancedConfigDefaults(),
  tunConfig: Defaults.TunConfigDefaults(),
  dnsConfig: Defaults.DnsConfigDefaults(),
  proxyGroupsConfig: Defaults.ProxyGroupsConfigDefaults(),
  rulesConfig: Defaults.RulesConfigDefaults(),
  dnsRulesConfig: Defaults.DnsRulesConfigDefaults()
})

const { t } = useI18n()
const { message } = useMessage()
const profilesStore = useProfilesStore()
const [showAdvancedSetting, toggleAdvancedSetting] = useBool(false)

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any
const handlePrevStep = () => currentStep.value--
const handleNextStep = () => currentStep.value++

const handleSave = async () => {
  try {
    if (props.isUpdate) {
      await profilesStore.editProfile(props.id, profile.value)
      handleSubmit()
    } else {
      await profilesStore.addProfile(profile.value)
      handleCancel()
    }
    return
  } catch (error: any) {
    console.error('handleSave: ', error)
    message.error(error)
    return
  }
}

const handleAdd = () => {
  const map: Record<number, Ref> = {
    '3': groupsRef,
    '4': rulesRef,
    '6': dnsRulesRef
  }
  map[currentStep.value].value.handleAdd()
}

if (props.isUpdate) {
  const p = profilesStore.getProfileById(props.id)
  if (p) {
    profile.value = deepClone(p)
  }
}
</script>

<template>
  <div @dblclick="toggleFullScreen" class="header" style="--wails-draggable: drag">
    <div class="header-title">{{ t(stepItems[currentStep].title) }}</div>
    <Button v-show="[3, 4, 6].includes(currentStep)" @click="handleAdd" type="link" class="ml-auto">
      {{ t('common.add') }}
    </Button>
  </div>

  <div class="form">
    <div v-show="currentStep === 0">
      <div class="form-item">
        <div class="name">{{ t('profile.name') }} *</div>
        <Input v-model="profile.name" auto-size autofocus class="flex-1 ml-8" />
      </div>
    </div>

    <div v-show="currentStep === 1">
      <GeneralConfig v-model="profile.generalConfig" />
      <Divider>
        <Button type="text" size="small" @click="toggleAdvancedSetting">
          {{ t('profile.advancedSettings') }}
        </Button>
      </Divider>
      <div v-if="showAdvancedSetting">
        <AdvancedConfig v-model="profile.advancedConfig" :profile="profile" />
      </div>
    </div>

    <div v-show="currentStep === 2">
      <TunConfig v-model="profile.tunConfig" />
    </div>

    <div v-show="currentStep === 3">
      <ProxyGroupsConfig ref="groupsRef" v-model="profile.proxyGroupsConfig" />
    </div>

    <div v-show="currentStep === 4">
      <RulesConfig
        ref="rulesRef"
        v-model="profile.rulesConfig"
        :proxy-groups="profile.proxyGroupsConfig"
        :profile="profile"
      />
    </div>

    <div v-show="currentStep === 5">
      <DnsConfig v-model="profile.dnsConfig" :proxy-groups="profile.proxyGroupsConfig" />
    </div>

    <div v-show="currentStep === 6">
      <DnsRulesConfig
        ref="dnsRulesRef"
        v-model="profile.dnsRulesConfig"
        :dns-config="profile.dnsConfig"
        :proxy-groups="profile.proxyGroupsConfig"
      />
    </div>
  </div>

  <div class="form-action">
    <Button @click="handlePrevStep" :disable="currentStep == 0" type="text">
      {{ t('common.prevStep') }}
    </Button>
    <Button
      @click="handleNextStep"
      :disable="!profile.name || currentStep == 6"
      type="text"
      class="mr-auto"
    >
      {{ t('common.nextStep') }}
    </Button>
    <Button @click="handleCancel">{{ t('common.cancel') }}</Button>
    <Button @click="handleSave" :disable="!profile.name" type="primary">
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
  max-height: 60vh;
}
</style>
