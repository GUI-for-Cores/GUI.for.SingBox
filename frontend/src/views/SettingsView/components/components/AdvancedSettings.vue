<script lang="ts" setup>
import { MakeDir, OpenDir } from '@/bridge'
import { RollingReleaseDirectory } from '@/constant/app'
import { useAppSettingsStore, useEnvStore } from '@/stores'
import { APP_TITLE, APP_VERSION } from '@/utils'

const appSettings = useAppSettingsStore()
const envStore = useEnvStore()

const handleOpenFolder = async () => {
  await OpenDir(envStore.env.basePath)
}

const handleOpenRollingReleaseFolder = async () => {
  await MakeDir(RollingReleaseDirectory)
  await OpenDir(RollingReleaseDirectory)
}

const handleClearApiToken = () => {
  appSettings.app.githubApiToken = ''
}

const handleClearUserAgent = () => {
  appSettings.app.userAgent = ''
}
</script>

<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.advanced') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.appFolder.name') }}</div>
      <Button @click="handleOpenFolder" type="primary" icon="folder">
        <span class="ml-8">{{ $t('settings.appFolder.open') }}</span>
      </Button>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.rollingRelease') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <div class="flex items-center gap-4">
        <Button @click="handleOpenRollingReleaseFolder" type="primary" icon="folder" size="small" />
        <Switch v-model="appSettings.app.rollingRelease" />
      </div>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.realMemoryUsage') }}</div>
      <Switch v-model="appSettings.app.kernel.realMemoryUsage" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.autoRestartKernel.name') }}
        <span class="font-normal text-12">({{ $t('settings.autoRestartKernel.tips') }})</span>
      </div>
      <Switch v-model="appSettings.app.autoRestartKernel" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.githubapi.name') }}
        <span class="font-normal text-12">({{ $t('settings.githubapi.tips') }})</span>
      </div>
      <Input v-model.lazy="appSettings.app.githubApiToken" editable class="text-14">
        <template #suffix>
          <Button
            @click="handleClearApiToken"
            v-tips="'settings.userAgent.reset'"
            type="text"
            size="small"
            icon="reset"
          />
        </template>
      </Input>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.userAgent.name') }}
        <span class="font-normal text-12">({{ $t('settings.userAgent.tips') }})</span>
      </div>
      <Input
        v-model.lazy="appSettings.app.userAgent"
        :placeholder="APP_TITLE + '/' + APP_VERSION"
        editable
        class="text-14"
      >
        <template #suffix>
          <Button
            @click="handleClearUserAgent"
            v-tips="'settings.userAgent.reset'"
            type="text"
            size="small"
            icon="reset"
          />
        </template>
      </Input>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.multipleInstance') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="appSettings.app.multipleInstance" />
    </div>
  </Card>
</template>
