<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { ClipboardSetText } from '@/utils/bridge'
import { DraggableOptions, View } from '@/constant'
import { debounce, generateConfig, sampleID } from '@/utils'
import {
  type ProfileType,
  type Menu,
  useProfilesStore,
  useAppSettingsStore,
  useApp,
  useKernelApiStore
} from '@/stores'

import ProfileForm from './components/ProfileForm.vue'

const profileID = ref()
const profileStep = ref(0)
const showForm = ref(false)
const isUpdate = ref(false)
const formTitle = computed(() => (isUpdate.value ? 'common.edit' : 'common.add'))

const { t } = useI18n()
const { message } = useMessage()
const appStore = useApp()
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
        message.info(error)
        console.error(error)
      }
    }
  },
  {
    label: 'profiles.copy',
    handler: async (id: string) => {
      const p = profilesStore.getProfileById(id)!
      appStore.setProfilesClipboard(p)
      message.info('common.success')
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
        message.info('common.success')
      } catch (error: any) {
        message.info(error)
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
    'profile.step.dnsRules',
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

const handlePasteProfile = () => {
  const p = appStore.getProfilesClipboard() as ProfileType
  p.id = sampleID()
  p.name = p.name + '(Copy)'
  profilesStore.addProfile(p)
  appStore.clearProfilesClipboard()
}

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
    message.info('profiles.shouldStop')
    return
  }

  try {
    await profilesStore.deleteProfile(p.id)
    message.info('common.success')
  } catch (error: any) {
    console.error('deleteProfile: ', error)
    message.info(error)
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
  <div v-if="profilesStore.profiles.length === 0" class="empty">
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

  <div v-else class="header">
    <Radio
      v-model="appSettingsStore.app.profilesView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
      style="margin-right: auto"
    />
    <template v-if="appStore.profilesClipboard">
      <Button @click="handlePasteProfile" type="link">
        {{ t('profiles.paste') }}
      </Button>
      <Button @click="appStore.clearProfilesClipboard" type="link">
        {{ t('profiles.clearClipboard') }}
      </Button>
    </template>
    <Button @click="handleAddProfile" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[profilesStore.profiles, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="appSettingsStore.app.profilesView"
    class="profiles"
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
      class="profile"
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
    :title="formTitle"
    :footer="false"
    @ok="onProfileFormEnd"
    max-height="80"
  >
    <ProfileForm :is-update="isUpdate" :id="profileID" :step="profileStep" />
  </Modal>
</template>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 9;
}

.empty {
  text-align: center;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profiles {
  flex: 1;
  margin-top: 8px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
}

.grid {
  .profile {
    display: inline-block;
    width: calc(33.333333% - 16px);
    margin: 8px;
  }
}
.list {
  .profile {
    margin: 8px;
  }
}
</style>
