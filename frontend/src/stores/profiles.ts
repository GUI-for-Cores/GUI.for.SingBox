import { ref } from 'vue'
import { defineStore } from 'pinia'
import { parse, stringify } from 'yaml'

import { debounce, ignoredError } from '@/utils'
import { Readfile, Writefile } from '@/bridge'
import { ProfilesFilePath } from '@/constant/app'
import { useAlert } from '@/hooks'

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref<IProfile[]>([])

  const setupProfiles = async () => {
    const data = await ignoredError(Readfile, ProfilesFilePath)
    data && (profiles.value = parse(data))

    const profilesCount = profiles.value.length
    const filteredProfiles = profiles.value.filter((profile) => !(profile as any).route)

    profiles.value = profiles.value.filter((profile) => {
      return (profile as any).route
    })

    if (profilesCount !== profiles.value.length) {
      const { alert } = useAlert()
      Writefile('data/.cache/profiles-backup.yaml', stringify(filteredProfiles))
      alert(
        'Tip',
        'The incompatible profiles has been saved to the file: data/.cache/profiles-backup.yaml.',
      )
    }
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
