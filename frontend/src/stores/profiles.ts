import { ref } from 'vue'
import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'

import { debounce, ignoredError, transformProfileV189To190 } from '@/utils'
import { Readfile, Writefile, Readdir, Movefile } from '@/bridge'
import { ProfilesFilePath } from '@/constant/app'
import { useAlert } from '@/hooks'

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<IProfile[]>([])

  const setupProfiles = async () => {
    const data = await ignoredError(Readfile, ProfilesFilePath)
    data && (profiles.value = parse(data))

    let needsDiskSync = false
    profiles.value.forEach((profile, index) => {
      if (!(profile as any).route) {
        profiles.value[index] = transformProfileV189To190(profile)
        needsDiskSync = true
      }
    })

    const dirs = await Readdir('data/.cache')
    const backupProfiles = dirs.find((file) => file.name === 'profiles-backup.yaml')
    if (backupProfiles) {
      const txt = await Readfile('data/.cache/profiles-backup.yaml')
      const oldProfiles = parse(txt)
      for (const p of oldProfiles) {
        profiles.value.push(transformProfileV189To190(p))
        needsDiskSync = true
      }
      await Movefile('data/.cache/profiles-backup.yaml', 'data/.cache/profiles-backup.yaml.done')
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
      const { alert } = useAlert()
      alert('Tip', 'The old profiles have been upgraded. Please adjust manually if necessary.')
    }

    // Fix missing invert field
    profiles.value.forEach((profile) => {
      profile.dns.rules.forEach((rule) => {
        if (typeof rule.invert === 'undefined') {
          rule.invert = false
        }
      })
    })
  }

  const saveProfiles = debounce(async () => {
    await Writefile(ProfilesFilePath, stringify(profiles.value))
  }, 100)

  const addProfile = async (p: IProfile) => {
    profiles.value.push(p)
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.pop()
      throw error
    }
  }

  const deleteProfile = async (id: string) => {
    const idx = profiles.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = profiles.value.splice(idx, 1)[0]
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.splice(idx, 0, backup)
      throw error
    }
  }

  const editProfile = async (id: string, p: IProfile) => {
    const idx = profiles.value.findIndex((v) => v.id === id)
    if (idx === -1) return
    const backup = profiles.value.splice(idx, 1, p)[0]
    try {
      await saveProfiles()
    } catch (error) {
      profiles.value.splice(idx, 1, backup)
      throw error
    }
  }

  const getProfileById = (id: string) => profiles.value.find((v) => v.id === id)

  return {
    profiles,
    setupProfiles,
    saveProfiles,
    addProfile,
    editProfile,
    deleteProfile,
    getProfileById,
  }
})
