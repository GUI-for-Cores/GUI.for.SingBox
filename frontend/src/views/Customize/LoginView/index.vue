<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NCheckbox,
  NConfigProvider,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NSpin,
} from 'naive-ui'
import { captcha, login } from '../api/api'
import {
  useAppSettingsStore,
  useProfilesStore,
  useSubscribesStore,
} from '@/stores'
import { message, sampleID } from '@/utils'

const router = useRouter()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()

const url = ref('')
const name = ref('')
const loading = ref(false)
const isLoading = ref(true)
const picPath = ref('')

const loginForm = ref({
  username: 'admin',
  password: 'jhsdfi8521!@#$.',
  captcha: '',
  captchaId: '',
  openCaptcha: false,
  remember: true,
})

const toWelcome = () => {
  router.push('/welcome')
}

const handleRegistration = () => {
  message.success('暂未开放注册，敬请期待')
}

const handleSave = async () => {
  name.value = 's-ui订阅'
  if (!name.value) {
    name.value = sampleID()
  }

  url.value = 'https://hksui.czvps.top/sub/123?x-token=' + appSettingsStore.app.userInfo.token
  const sub = subscribeStore.getSubscribeTemplate(name.value, { url: url.value })

  
  try {
    if (subscribeStore.subscribes.length) {
      const idsToDelete = subscribeStore.subscribes.map((s) => s.id)
      for (let i = idsToDelete.length - 1; i >= 0; i--) {
        await subscribeStore.deleteSubscribe(idsToDelete[i] as string)
      }
    }

    if (profilesStore.profiles.length) {
      const idsProfilesToDelete = profilesStore.profiles.map((s) => s.id)
      for (let i = idsProfilesToDelete.length - 1; i >= 0; i--) {
        await profilesStore.deleteProfile(idsProfilesToDelete[i] as string)
      }
    }

    await subscribeStore.addSubscribe(sub)
    await subscribeStore.updateSubscribe(sub.id)
  } catch (error: any) {
    await subscribeStore.deleteSubscribe(sub.id)
    throw error
  }

  const profile = profilesStore.getProfileTemplate(name.value)

  if (profile.outbounds[0] && profile.outbounds[1]) {
    profile.outbounds[0].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
    profile.outbounds[1].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
  }

  await profilesStore.addProfile(profile)
  appSettingsStore.app.kernel.profile = profile.id

  message.success('home.initSuccessful')
}

const loginVerify = async () => {
  isLoading.value = true
  const result = await captcha()

  if (result.code == 0) {
    picPath.value = result.data.picPath
    loginForm.value.captchaId = result.data.captchaId
  }

  isLoading.value = false
}

const loginIn = async () => {
  loading.value = true

  try {
    const result = await login(loginForm.value)

    if (result.code == 0) {
      appSettingsStore.app.userInfo.token = result.data.token
      appSettingsStore.app.userInfo.userName = result.data.user.userName
      await handleSave()
      toWelcome()
    } else {
      message.error(result.msg)
      await loginVerify()
    }
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  } finally {
    loading.value = false
  }
}

loginVerify()
</script>

<template>
  <n-config-provider>
    <div class="flex justify-center p-20px">
      <n-card
        class="w-430px rounded-25px border-none bg-[rgba(246,246,246,0.85)] shadow-2xl backdrop-blur-12px"
        :bordered="false"
      >
        <div class="mb-32px text-center">
          <div class="mb-12px text-48px">🔐</div>
          <h1 class="text-28px text-black font-bold tracking-tight">Z-VPN</h1>
          <p class="mt-6px text-15px text-gray-400">安全 · 高速 · 稳定</p>
        </div>

        <n-form :model="loginForm" label-placement="top">
          <n-form-item label="邮箱地址" class="mb-20px">
            <n-input
              v-model:value="loginForm.username"
              placeholder="请输入邮箱地址"
              type="text"
              size="large"
              clearable
            />
          </n-form-item>

          <n-form-item label="密码" class="mb-8px">
            <n-input
              v-model:value="loginForm.password"
              placeholder="请输入密码"
              type="password"
              size="large"
              show-password-on="click"
            />
          </n-form-item>

          <n-form-item label="验证码">
            <div class="flex gap-12px">
              <n-input v-model:value="loginForm.captcha" placeholder="请输入验证码" class="flex-1" />
              <n-spin size="small" :show="isLoading">
                <n-image
                  width="100"
                  :preview-disabled="true"
                  :src="picPath"
                  :loading="isLoading"
                  @click="loginVerify()"
                />
              </n-spin>
            </div>
          </n-form-item>

          <div class="mb-28px flex items-center justify-between">
            <n-checkbox v-model:checked="loginForm.remember">记住登录</n-checkbox>
            <n-button text type="primary" size="small" class="text-14px" @click="toWelcome">
              忘记密码？
            </n-button>
          </div>

          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            class="h-52px text-16px font-medium"
            @click="loginIn"
          >
            立即登录
          </n-button>

          <div class="mt-32px text-center text-14px text-gray-400">
            还没有账号？
            <n-button text type="primary" size="small" class="ml-4px" @click="handleRegistration">
              立即注册
            </n-button>
          </div>
        </n-form>
      </n-card>
    </div>
  </n-config-provider>
</template>
