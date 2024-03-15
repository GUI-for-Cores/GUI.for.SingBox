<script setup lang="ts">
import { ref } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { ClipboardSetText } from '@/bridge'
import { DraggableOptions, View } from '@/constant'
import { debounce, deepClone, generateConfig, sampleID } from '@/utils'
import {
  type ProfileType,
  type Menu,
  useProfilesStore,
  useAppSettingsStore,
  useKernelApiStore
} from '@/stores'

import ProfileForm from './components/ProfileForm.vue'

const profileID = ref()
const profileStep = ref(0)
const showForm = ref(false)
const isUpdate = ref(false)

const { t } = useI18n()
const { message } = useMessage()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()

const secondaryMenus: Menu[] = [
  {
    label: 'profiles.start',
    handler: async (id: string) => {
      appSettingsStore.app.kernel.profile = id
      try {
        await kernelApiStore.startKernel()
      } catch (error: any) {
        message.error(error)
        console.error(error)
      }
    }
  },
  {
    label: 'profiles.copy',
    handler: async (id: string) => {
      const p = deepClone(profilesStore.getProfileById(id)!)
      p.id = sampleID()
      p.name = p.name + '(Copy)'
      profilesStore.addProfile(p)
      message.success('common.success')
    }
  },
  {
    label: 'profiles.copytoClipboard',
    handler: async (id: string) => {
      const p = profilesStore.getProfileById(id)!
      try {
        const config = await generateConfig(p)
        const str = JSON.stringify(config, null, 2)
        const ok = await ClipboardSetText(str)
        if (!ok) throw 'ClipboardSetText Error'
        message.success('common.success')
      } catch (error: any) {
        message.error(error.message || error)
      }
    }
  }
]

const menus: Menu[] = [
  ...[
    'profile.step.name',
    'profile.step.general',
    'profile.step.tun',
    'profile.step.groups',
    'profile.step.rules',
    'profile.step.dns',
    'profile.step.dnsRules'
  ].map((v, i) => {
    return {
      label: v,
      handler: (id: string) => {
        const p = profilesStore.getProfileById(id)
        p && handleEditProfile(p, i)
      }
    }
  }),
  {
    label: '',
    separator: true
  },
  {
    label: 'common.more',
    children: secondaryMenus
  }
]

const handleAddProfile = async () => {
  isUpdate.value = false
  profileStep.value = 0
  showForm.value = true
}

const handleEditProfile = (p: ProfileType, step = 0) => {
  isUpdate.value = true
  profileID.value = p.id
  profileStep.value = step
  showForm.value = true
}

const handleDeleteProfile = async (p: ProfileType) => {
  const { profile, running } = appSettingsStore.app.kernel
  if (profile === p.id && running) {
    message.warn('profiles.shouldStop')
    return
  }

  try {
    await profilesStore.deleteProfile(p.id)
  } catch (error: any) {
    console.error('deleteProfile: ', error)
    message.error(error)
  }
}

const handleUseProfile = async (p: ProfileType) => {
  if (appSettingsStore.app.kernel.profile === p.id) return

  appSettingsStore.app.kernel.profile = p.id

  if (appSettingsStore.app.kernel.running) {
    await kernelApiStore.restartKernel()
  }
}

const onProfileFormEnd = async () => {
  const { running, profile } = appSettingsStore.app.kernel
  if (running && profile === profileID.value) {
    await kernelApiStore.restartKernel()
  }
}

const onSortUpdate = debounce(profilesStore.saveProfiles, 1000)
</script>

<template>
  <div v-if="profilesStore.profiles.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="profiles.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddProfile" type="link">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio
      v-model="appSettingsStore.app.profilesView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
      class="mr-auto"
    />
    <Button @click="handleAddProfile" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[profilesStore.profiles, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="'grid-list-' + appSettingsStore.app.profilesView"
  >
    <Card
      v-for="p in profilesStore.profiles"
      :key="p.id"
      :title="p.name"
      :selected="appSettingsStore.app.kernel.profile === p.id"
      @dblclick="handleUseProfile(p)"
      v-menu="
        menus.map((v) => ({
          ...v,
          handler: () => v.handler?.(p.id),
          children: v.children?.map((vv) => ({ ...vv, handler: () => vv.handler?.(p.id) }))
        }))
      "
      class="item"
    >
      <template v-if="appSettingsStore.app.profilesView === View.Grid" #extra>
        <Dropdown :trigger="['hover', 'click']">
          <Button type="link" size="small">
            {{ t('common.more') }}
          </Button>
          <template #overlay>
            <Button @click="handleUseProfile(p)" type="link" size="small">
              {{ t('common.use') }}
            </Button>
            <Button @click="handleEditProfile(p)" type="link" size="small">
              {{ t('common.edit') }}
            </Button>
            <Button @click="handleDeleteProfile(p)" type="link" size="small">
              {{ t('common.delete') }}
            </Button>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button @click="handleUseProfile(p)" type="link" size="small">
          {{ t('common.use') }}
        </Button>
        <Button @click="handleEditProfile(p)" type="link" size="small">
          {{ t('common.edit') }}
        </Button>
        <Button @click="handleDeleteProfile(p)" type="link" size="small">
          {{ t('common.delete') }}
        </Button>
      </template>
      <div>
        proxy groups:
        {{ p.proxyGroupsConfig.length }}
        / rules:
        {{ p.rulesConfig.length }}
      </div>
      <div>
        TUN:
        {{ p.tunConfig.enable ? t('common.enabled') : t('common.disabled') }}
        / DNS:
        {{ p.dnsConfig.enable ? t('common.enabled') : t('common.disabled') }}
      </div>
      <div>
        Http:
        {{ p.advancedConfig.port || '--' }}
        Socks:
        {{ p.advancedConfig['socks-port'] || '--' }}
        Mixed:
        {{ p.generalConfig['mixed-port'] || '--' }}
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showForm"
    :footer="false"
    @ok="onProfileFormEnd"
    min-width="70"
    max-height="90"
  >
    <ProfileForm :is-update="isUpdate" :id="profileID" :step="profileStep" />
  </Modal>
</template>

<style lang="less" scoped></style>
