<script setup lang="ts">
import { useI18n, I18nT } from 'vue-i18n'

import { ClipboardSetText } from '@/bridge'
import { DraggableOptions, ViewOptions } from '@/constant/app'
import { View } from '@/enums/app'
import {
  useProfilesStore,
  useAppSettingsStore,
  useKernelApiStore,
  useSubscribesStore,
  usePluginsStore,
  useAppStore,
} from '@/stores'
import { debounce, deepClone, generateConfig, message, sampleID, alert } from '@/utils'

import { useModal } from '@/components/Modal'

import ProfileForm from './components/ProfileForm.vue'

import type { Menu } from '@/types/app'

const { t } = useI18n()
const [Modal, modalApi] = useModal({})
const appStore = useAppStore()
const profilesStore = useProfilesStore()
const subscribesStore = useSubscribesStore()
const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const pluginsStore = usePluginsStore()

const menuList: Menu[] = [
  'profile.step.name',
  'profile.step.general',
  'profile.step.inbounds',
  'profile.step.outbounds',
  'profile.step.route',
  'profile.step.dns',
  'profile.step.mixin-script',
].map((v, i) => {
  return {
    label: v,
    handler: (id: string) => {
      const p = profilesStore.getProfileById(id)
      p && handleShowProfileForm(p.id, i)
    },
  }
})

const secondaryMenusList: Menu[] = [
  {
    label: 'profiles.start',
    handler: async (id: string) => {
      appSettingsStore.app.kernel.profile = id
      try {
        const e = await kernelApiStore.stopCore().catch((e) => e)
        if (e && e !== 'The core is not running') {
          throw e
        }
        await kernelApiStore.startCore()
      } catch (error: any) {
        message.error(error)
        console.error(error)
      }
    },
  },
  {
    label: 'profiles.copy',
    handler: async (id: string) => {
      const p = deepClone(profilesStore.getProfileById(id)!)
      p.id = sampleID()
      p.name = p.name + '(Copy)'
      profilesStore.addProfile(p)
      message.success('common.success')
    },
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
    },
  },
  {
    label: 'profiles.generateAndView',
    handler: async (id: string) => {
      const p = profilesStore.getProfileById(id)!
      try {
        const config = await generateConfig(p)
        alert(p.name, JSON.stringify(config, null, 2))
      } catch (error: any) {
        message.error(error.message || error)
      }
    },
  },
]

const generateMenus = (profile: IProfile) => {
  const moreMenus: Menu[] = secondaryMenusList.map((v) => ({
    ...v,
    handler: () => v.handler?.(profile.id),
  }))
  const builtInMenus: Menu[] = [
    ...menuList.map((v) => ({ ...v, handler: () => v.handler?.(profile.id) })),
    {
      label: '',
      separator: true,
    },
    {
      label: 'common.more',
      children: moreMenus,
    },
  ]

  const contextMenus = pluginsStore.plugins.filter(
    (plugin) => Object.keys(plugin.context.profiles).length !== 0,
  )

  if (contextMenus.length !== 0) {
    moreMenus.push(
      {
        label: '',
        separator: true,
      },
      ...contextMenus.reduce((prev, plugin) => {
        const menus = Object.entries(plugin.context.profiles)
        return prev.concat(
          menus.map(([title, fn]) => {
            return {
              label: title,
              handler: async () => {
                try {
                  plugin.running = true
                  await pluginsStore.manualTrigger(plugin.id, fn as any, profile)
                } catch (error: any) {
                  message.error(error)
                } finally {
                  plugin.running = false
                }
              },
            }
          }),
        )
      }, [] as Menu[]),
    )
  }

  return builtInMenus
}

const handleShowProfileForm = (id?: string, step = 0) => {
  modalApi.setProps({ minWidth: '70' })
  modalApi.setContent(ProfileForm, { id, step }).open()
}

const handleDeleteProfile = async (p: IProfile) => {
  const { profile } = appSettingsStore.app.kernel
  if (profile === p.id && kernelApiStore.running) {
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

const handleUseProfile = async (p: IProfile) => {
  if (appSettingsStore.app.kernel.profile === p.id) return

  appSettingsStore.app.kernel.profile = p.id

  if (kernelApiStore.running) {
    await kernelApiStore.restartCore()
  }
}

const isCreatedBySubscription = (id: string) => {
  return !!subscribesStore.getSubscribeById(id)
}

const showAuto = () => alert('Tips', 'profile.auto')

const onSortUpdate = debounce(profilesStore.saveProfiles, 1000)
</script>

<template>
  <div v-if="profilesStore.profiles.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="profiles.empty" tag="div" scope="global" class="flex items-center mt-12">
          <template #action>
            <Button @click="handleShowProfileForm()" type="link">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
        <div class="flex items-center">
          <CustomAction :actions="appStore.customActions.profiles_header" />
        </div>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio v-model="appSettingsStore.app.profilesView" :options="ViewOptions" class="mr-auto" />
    <CustomAction :actions="appStore.customActions.profiles_header" />
    <Button @click="handleShowProfileForm()" type="primary" icon="add">
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
      v-menu="generateMenus(p)"
      class="grid-list-item"
    >
      <template #title-prefix>
        <Tag
          v-if="isCreatedBySubscription(p.id)"
          @click="showAuto"
          color="primary"
          style="margin-left: 0"
        >
          {{ t('common.auto') }}
        </Tag>
      </template>

      <template v-if="appSettingsStore.app.profilesView === View.Grid" #extra>
        <Dropdown>
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <Button @click="handleUseProfile(p)" type="text">
                {{ t('common.use') }}
              </Button>
              <Button @click="handleShowProfileForm(p.id)" type="text">
                {{ t('common.edit') }}
              </Button>
              <Button @click="handleDeleteProfile(p)" type="text">
                {{ t('common.delete') }}
              </Button>
            </div>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button @click="handleUseProfile(p)" type="text" size="small">
          {{ t('common.use') }}
        </Button>
        <Button @click="handleShowProfileForm(p.id)" type="text" size="small">
          {{ t('common.edit') }}
        </Button>
        <Button @click="handleDeleteProfile(p)" type="text" size="small">
          {{ t('common.delete') }}
        </Button>
      </template>
      <div>
        {{ t('profiles.inbounds') }}
        :
        {{ p.inbounds.length }}
        /
        {{ t('profiles.outbounds') }}
        :
        {{ p.outbounds.length }}
      </div>
      <div>
        {{ t('kernel.route.tab.rule_set') }}
        :
        {{ p.route.rule_set.length }}
        /
        {{ t('kernel.route.tab.rules') }}
        :
        {{ p.route.rules.length }}
      </div>
      <div>
        {{ t('profiles.dnsServers') }}
        :
        {{ p.dns.servers.length }}
        /
        {{ t('profiles.dnsRules') }}
        :
        {{ p.dns.rules.length }}
      </div>
    </Card>
  </div>

  <Modal />
</template>
