<script setup lang="ts">
import { ref, watch, useTemplateRef, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
// import router from '@/router'
import { 
  NConfigProvider,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSelect,
  NCheckbox,
  NDivider,
  NSpace,
  darkTheme
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { captcha, login } from '../api/api'
import { useProfilesStore, useAppSettingsStore, useSubscribesStore, useKernelApiStore } from '@/stores'
import { message, sampleID } from '@/utils'
import vLoading from '@/views/Customize/components/directives/vLoading'
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()
const kernelApiStore = useKernelApiStore()
const url = ref('')
const name = ref('')
const loading = ref(false)
const isLoading = ref(true)
const picPath = ref('')
// const handleCancel = inject('cancel') as any
// const handleSubmit = inject('submit') as any
const router = useRouter()
const user = ref({
  account: '',
  password: ''
})

const handleLogin = () => {
  router.push('/welcome')
  console.log('WWW', user.value.account, user.value.password);
  handleSave()

}
const toWelcome = () => {
  router.push('/welcome')
}

const handleSave = async () => {
  console.log('被调用');

  name.value = 's-ui订阅'
  if (!name.value) {
    name.value = sampleID()
  }
  url.value = 'https://hksui.czvps.top/sub/123?x-token=' + appSettingsStore.app.userInfo.token
  // url.value = 'http://localhost:8080/api/sysParams/getSingBoxmConfig?x-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVVUlEIjoiMTY3NDcxNTEtYTMxOS00N2VkLWJhNTUtZjZhMjQ4NWJhODg3IiwiSUQiOjEsIlVzZXJuYW1lIjoiYWRtaW4iLCJOaWNrTmFtZSI6Ik1yLuWlh-a3vCIsIkF1dGhvcml0eUlkIjo4ODgsIkJ1ZmZlclRpbWUiOjg2NDAwLCJpc3MiOiJxbVBsdXMiLCJhdWQiOlsiR1ZBIl0sImV4cCI6MTc3NTI4NDI1NiwibmJmIjoxNzc0Njc5NDU2fQ.Ru3vNp-mNP9Q7evDXsK0HeAUyzfZqa9dY5WmtLVSDPA'
  const sub = subscribeStore.getSubscribeTemplate(name.value, { url: url.value })

  loading.value = true

  try {
    // 先删掉之前的订阅，以免每次订阅越来越多
   // console.log('subscribeStore.subscribes.length：', subscribeStore.subscribes.length);
    if (subscribeStore.subscribes.length) {

      // 复制一份 ID 列表，避免遍历时修改原数组
      const idsToDelete = subscribeStore.subscribes.map(s => s.id);
      for (let i = idsToDelete.length - 1; i >= 0; i--) {
        await subscribeStore.deleteSubscribe(idsToDelete[i] as string);
        console.log('已删除之前订阅节点');
        // await profilesStore.deleteProfile(idsToDelete[i] as string);
        // console.log('已删除之前配置节点');

      }

    }
    if (profilesStore.profiles.length) {
      const idsProfilesToDelete = profilesStore.profiles.map(s => s.id);
      for (let i = idsProfilesToDelete.length - 1; i >= 0; i--) {
        await profilesStore.deleteProfile(idsProfilesToDelete[i] as string);
        console.log('已删除之前配置节点');
      }
    }
    await subscribeStore.addSubscribe(sub)
    await subscribeStore.updateSubscribe(sub.id)
  } catch (error: any) {
    loading.value = false
    console.log(error)
    message.error(error)
    subscribeStore.deleteSubscribe(sub.id)
    return
  }

  const profile = profilesStore.getProfileTemplate(name.value)

  if (profile.outbounds[0] && profile.outbounds[1]) {
    profile.outbounds[0].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
    profile.outbounds[1].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
  }

  await profilesStore.addProfile(profile)

  appSettingsStore.app.kernel.profile = profile.id

  message.success('home.initSuccessful')

  loading.value = false

  // handleSubmit()


}

const loginFormData = ref({
  username: 'admin',
  password: 'jhsdfi8521!@#$.',
  captcha: '',
  captchaId: '',
  openCaptcha: false
})
const loginVerify = async () => {
  isLoading.value = true
  const result = await captcha()
  console.log('验证码：', result)
  console.log('验证码code：', result.code)
  if (result.code == 0) {
    picPath.value = result.data.picPath
    //  loginFormData.value.captcha = result.data.captcha
    loginFormData.value.captchaId = result.data.captchaId
  }
  isLoading.value = false
}
const loginIn = async () => {
  loading.value = true
  const result = await login(loginFormData.value)

  console.log('登录结果：', result)
  if (result.code == 0) {
    console.log('登录成功：')
    appSettingsStore.app.userInfo.token = result.data.token
    appSettingsStore.app.userInfo.userName = result.data.user.userName
    toWelcome()
    handleSave()
  } else {
    console.log('登录异常：')
    message.error(result.msg)
    // 登陆失败，刷新验证码
    await loginVerify()

  }
  loading.value = false
}

loginVerify()


const formValue = ref({
  server: 'jp-tokyo-01',
  email: '',
  password: '',
  remember: true
})

const serverOptions = [
  { label: '日本东京 01 (低延迟)', value: 'jp-tokyo-01' },
  { label: '新加坡 01', value: 'sg-01' },
  { label: '美国洛杉矶 02', value: 'us-la-02' },
  { label: '德国法兰克福 01', value: 'de-fr-01' },
  { label: '香港 01', value: 'hk-01' }
]



</script>

<template>
  <div class="w-full h-[90%]">
    <div class=" flex flex-col items-center justify-center">欢迎来到Z-VPN，请登录</div>
    <div class="form">
      <div class="flex mt-8">
        <div class="mr-20 form-item">账号:</div>
        <Input v-model="loginFormData.username" autofocus class="" />
      </div>
      <div class="flex  mt-8">
        <div class="mr-20 form-item">密码:</div>
        <Input v-model="loginFormData.password" type="password" autofocus class="" />

      </div>
      <div class="flex  mt-8 "  >
        <div class="mr-20 form-item">验证码:</div>
        <Input v-model="loginFormData.captcha" autofocus class="" />
        <div class="ml-8 " v-loading="isLoading">
         <img  class="h-30" :src="picPath" alt="请输入验证码" @click="loginVerify()" />
        </div>
      </div>
    </div>
    <div class="flex items-center justify-center mt-8 gap-12">
      <!-- 
      <Button type="primary" @click="handleLogin">登录</Button> -->

      <Button type="primary" :loading="loading" @click="loginIn">登录</Button>
      <Button type="primary" @click="toWelcome">跳转欢迎页</Button>
    </div>



  </div>

<n-config-provider :theme="darkTheme">
    <div class="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] flex items-center justify-center p-20px">
      <n-card 
        class="w-420px bg-[rgba(255,255,255,0.06)] backdrop-blur-12px border-none shadow-2xl"
        :bordered="false"
      >
        <!-- Logo & 标题 -->
        <div class="text-center mb-32px">
          <div class="text-52px mb-12px">🔒</div>
          <h1 class="text-28px text-white font-bold tracking-tight">SecureVPN</h1>
          <p class="text-15px text-gray-400 mt-6px">安全 • 高速 • 稳定</p>
        </div>

        <n-form :model="formValue" label-placement="top">
          <!-- 服务器 -->
          <!-- <n-form-item label="推荐服务器" class="mb-20px">
            <n-select
              v-model:value="formValue.server"
              :options="serverOptions"
              placeholder="请选择服务器节点"
              size="large"
            />
          </n-form-item> -->

          <!-- 邮箱 -->
          <n-form-item label="邮箱地址" class="mb-20px">
            <n-input
              v-model:value="formValue.email"
              placeholder="请输入邮箱地址"
              type="text"
              size="large"
              clearable
            />
          </n-form-item>

          <!-- 密码 -->
          <n-form-item label="密码" class="mb-8px">
            <n-input
              v-model:value="formValue.password"
              placeholder="请输入密码"
              size="large"
              show-password-on="click"
            />
          </n-form-item>

          <!-- 记住我 + 忘记密码 -->
          <div class="flex justify-between items-center mb-28px">
            <n-checkbox v-model:checked="formValue.remember">
              记住登录
            </n-checkbox>
            <n-button text type="primary" size="small" class="text-14px">
              忘记密码？
            </n-button>
          </div>

          <!-- 登录按钮 -->
          <n-button
            type="primary"
            size="large"
            block
            class="h-52px text-16px font-medium"
            @click="handleLogin"
          >
            立即登录
          </n-button>

          <n-divider class="my-24px text-gray-500">其他方式登录</n-divider>

          <!-- 第三方登录 -->
          <n-space justify="center" :size="12">
            <n-button secondary size="large" class="flex-1">Google</n-button>
            <n-button secondary size="large" class="flex-1">Apple</n-button>
            <n-button secondary size="large" class="flex-1">微信</n-button>
          </n-space>

          <!-- 注册 -->
          <div class="text-center text-14px text-gray-400 mt-32px">
            还没有账号？
            <n-button text type="primary" size="small" class="ml-4px">立即注册</n-button>
          </div>
        </n-form>
      </n-card>
    </div>
  </n-config-provider>





</template>
<style lang="less" scoped>
</style>