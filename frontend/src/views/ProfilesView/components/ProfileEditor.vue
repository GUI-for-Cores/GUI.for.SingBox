<script setup lang="ts">
import { ref, inject, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { generateConfig, message, restoreProfile } from '@/utils'

import Button from '@/components/Button/index.vue'
import { useProfilesStore } from '@/stores'

interface Props {
  profile: IProfile
}

const props = defineProps<Props>()

const loading = ref(false)
const profileText = ref('')

const { t } = useI18n()
const profilesStore = useProfilesStore()

const handleCancel = inject('cancel') as any
const handleSubmit = inject('submit') as any

const handleSave = async () => {
  loading.value = true
  try {
    const subscriptions = props.profile.outbounds.reduce((p, c) => {
      c.outbounds.forEach((outbound) => {
        if (outbound.type !== 'Built-in') {
          const id = outbound.type === 'Subscription' ? outbound.id : outbound.type
          p.add(id)
        }
      })
      return p
    }, new Set<string>())
    const newProfile = restoreProfile(JSON.parse(profileText.value), props.profile.name, {
      profile: props.profile,
      subscriptionIds: [...subscriptions],
    })
    newProfile.id = props.profile.id
    newProfile.mixin = props.profile.mixin
    newProfile.script = props.profile.script
    await profilesStore.editProfile(props.profile.id, newProfile)
    await handleSubmit()
  } catch (error: any) {
    console.log(error)
    message.error(error.message || error)
  }
  loading.value = false
}

onMounted(() => {
  generateConfig(props.profile, {
    enableStableConfigCompat: false,
    enablePluginProcessing: false,
    enableMixinProcessing: false,
    enableScriptProcessing: false,
  }).then((text) => {
    profileText.value = JSON.stringify(text, null, 2)
  })
})

const modalSlots = {
  cancel: () =>
    h(
      Button,
      {
        disabled: loading.value,
        onClick: handleCancel,
      },
      () => t('common.cancel'),
    ),
  submit: () =>
    h(
      Button,
      {
        type: 'primary',
        loading: loading.value,
        onClick: handleSave,
      },
      () => t('common.save'),
    ),
}

defineExpose({ modalSlots })
</script>

<template>
  <CodeViewer v-model="profileText" lang="json" editable class="h-full" />
</template>
