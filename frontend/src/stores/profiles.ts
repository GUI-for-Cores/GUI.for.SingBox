import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { parse } from 'yaml'

import { ReadFile, WriteFile, ReadDir, MoveFile } from '@/bridge'
import { ProfilesFilePath } from '@/constant/app'
import { useAppSettingsStore } from '@/stores'
import {
  ignoredError,
  transformProfileV189To190,
  transformProfileV194,
  alert,
  eventBus,
  stringifyNoFolding,
} from '@/utils'

export const useProfilesStore = defineStore('profiles', () => {
  const appSettingsStore = useAppSettingsStore()

  const profiles = ref<IProfile[]>([])
  const currentProfile = computed(() => getProfileById(appSettingsStore.app.kernel.profile))

  const setupProfiles = async () => {
    const data = await ignoredError(ReadFile, ProfilesFilePath)
    data && (profiles.value = parse(data))

    let needsDiskSync = false
    profiles.value.forEach((profile, index) => {
      if (!(profile as any).route) {
        profiles.value[index] = transformProfileV189To190(profile)
        needsDiskSync = true
      }
    })

    const dirs = await ReadDir('data/.cache')
    const backupProfiles = dirs.find((file) => file.name === 'profiles-backup.yaml')
    if (backupProfiles) {
      const txt = await ReadFile('data/.cache/profiles-backup.yaml')
      const oldProfiles = parse(txt)
      for (const p of oldProfiles) {
        profiles.value.push(transformProfileV189To190(p))
        needsDiskSync = true
      }
      await MoveFile('data/.cache/profiles-backup.yaml', 'data/.cache/profiles-backup.yaml.done')
    }

    if (needsDiskSync) {
      // Remove duplicates
      profiles.value = profiles.value.reduce((p, c) => {
        const x = p.find((item) => item.id === c.id)
        if (!x) {
          return p.concat([c])
        } else {
          return p
        }
      }, [] as IProfile[])

      await saveProfiles()
      alert('Tip', 'The old profiles have been upgraded. Please adjust manually if necessary.')
    }

    needsDiskSync = false
    profiles.value.forEach((profile, index) => {
      // Fix missing invert field
      profile.dns.rules.forEach((rule) => {
        if (typeof rule.invert === 'undefined') {
          rule.invert = false
        }
      })
      // @ts-expect-error(Deprecated)
      if (profile.dns.fakeip) {
        needsDiskSync = true
        profiles.value[index] = transformProfileV194(profile)
      }
      profile.inbounds.forEach((inbound) => {
        if (inbound.tun && !inbound.tun.route_exclude_address) {
          inbound.tun.route_exclude_address = []
          needsDiskSync = true
        }
      })
      if (!profile.mixin.format) {
        profile.mixin.format = 'json'
        needsDiskSync = true
      }
    })

    if (needsDiskSync) {
      await saveProfiles()
    }
  }

  const saveProfiles = () => {
    return WriteFile(ProfilesFilePath, stringifyNoFolding(profiles.value))
  }

  const addProfile = async (p: IProfile) => {
    profiles.value.push(p)
    try {
      await saveProfiles()
    } catch (error) {
      const idx = profiles.value.indexOf(p)
      if (idx !== -1) {
        profiles.value.splice(idx, 1)
      }
      throw error
    }
  }

  const deleteProfile = async (id: string) => {
    const idx = profiles.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = profiles.value.splice(idx, 1)[0]!
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.splice(idx, 0, backup)
      throw error
    }

    eventBus.emit('profileChange', { id })
  }

  const editProfile = async (id: string, p: IProfile) => {
    const idx = profiles.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = profiles.value.splice(idx, 1, p)[0]!
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.splice(idx, 1, backup)
      throw error
    }

    eventBus.emit('profileChange', { id })
  }

  const getProfileById = (id: string) => profiles.value.find((v) => v.id === id)

  return {
    profiles,
    currentProfile,
    setupProfiles,
    saveProfiles,
    addProfile,
    editProfile,
    deleteProfile,
    getProfileById,
  }
})
