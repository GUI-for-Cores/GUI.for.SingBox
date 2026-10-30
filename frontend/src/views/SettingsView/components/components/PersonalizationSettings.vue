<script lang="ts" setup>
import { ref } from 'vue'

import { BrowserOpenURL, Download, MakeDir, OpenDir } from '@/bridge'
import { ColorOptions, DefaultFontFamily, LocalesFilePath, ThemeOptions } from '@/constant/app'
import { Color, OS } from '@/enums/app'
import routes from '@/router/routes'
import { useAppSettingsStore, useAppStore } from '@/stores'
import { APP_LOCALES_URL, message } from '@/utils'

const pages = routes.flatMap((route) => {
  if (route.meta?.hidden !== undefined) return []
  return {
    label: route.meta!.name,
    value: route.name as string,
  }
})

const appStore = useAppStore()
const appSettings = useAppSettingsStore()

const resetFontFamily = () => {
  appSettings.app.fontFamily = DefaultFontFamily
}

const onThemeClick = (e: MouseEvent) => {
  document.documentElement.style.setProperty('--x', e.clientX + 'px')
  document.documentElement.style.setProperty('--y', e.clientY + 'px')
}

const handleOpenLocalesFolder = async () => {
  await MakeDir(LocalesFilePath)
  await OpenDir(LocalesFilePath)
}

const remoteLocales = ['ru', 'fa', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'vi']
const downloadingLocales = ref<Set<string>>(new Set())

const handleDownloadLocale = async (locale: string) => {
  downloadingLocales.value.add(locale)
  try {
    await Download(
      `${APP_LOCALES_URL.replace('github.com', 'raw.githubusercontent.com').replace('/tree/', '/')}/${locale}.json`,
      `${LocalesFilePath}/${locale}.json`,
    )
    await appStore.loadLocales()
    message.success('common.success')
  } catch (error) {
    message.error(error)
  }
  downloadingLocales.value.delete(locale)
}
</script>
<template>
  <div class="px-8 py-12 text-18 font-bold">{{ $t('settings.personalization') }}</div>

  <Card>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.theme.name') }}</div>
      <Radio v-model="appSettings.app.theme" :options="ThemeOptions" @click="onThemeClick" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.color.name') }}</div>
      <div class="flex items-center">
        <div v-if="appSettings.app.color === Color.Custom" class="flex items-center mr-4">
          <ColorPicker v-model="appSettings.app.primaryColor">
            <template #suffix>
              <div class="text-12">{{ $t('settings.color.primary') }}</div>
            </template>
          </ColorPicker>
          <ColorPicker v-model="appSettings.app.secondaryColor">
            <template #suffix>
              <div class="text-12">{{ $t('settings.color.secondary') }}</div>
            </template>
          </ColorPicker>
        </div>
        <Radio v-model="appSettings.app.color" :options="ColorOptions" />
      </div>
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="flex items-center text-16 font-bold">
        <div class="mr-4">{{ $t('settings.lang.name') }}</div>
        <Button type="text" icon="link" @click="BrowserOpenURL(APP_LOCALES_URL)" />
        <Dropdown>
          <Button type="text" icon="download" />
          <template #overlay>
            <div class="flex flex-col gap-4 min-w-64 p-4">
              <div
                v-for="locale in remoteLocales"
                :key="locale"
                class="flex items-center justify-between gap-8 pl-8 text-14 font-normal"
              >
                <span>{{ locale }}</span>
                <Button
                  v-if="appStore.locales.some(({ value }) => value === locale)"
                  :loading="downloadingLocales.has(locale)"
                  type="text"
                  size="small"
                  icon="update"
                  @click="handleDownloadLocale(locale)"
                />
                <Button
                  v-else
                  :loading="downloadingLocales.has(locale)"
                  type="text"
                  size="small"
                  icon="download"
                  @click="handleDownloadLocale(locale)"
                />
              </div>
            </div>
          </template>
        </Dropdown>
        <Button type="text" icon="folder" @click="handleOpenLocalesFolder" />
        <Button
          v-tips="'settings.lang.load'"
          :loading="appStore.localesLoading"
          type="text"
          icon="refresh"
          @click="appStore.loadLocales()"
        />
      </div>
      <Select
        v-if="appStore.locales.length >= 6"
        v-model="appSettings.app.lang"
        :options="appStore.locales"
      />
      <Radio v-else v-model="appSettings.app.lang" :options="appStore.locales" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.fontFamily') }}</div>
      <Input v-model="appSettings.app.fontFamily" editable class="text-14">
        <template #suffix>
          <Button
            v-tips="'settings.resetFont'"
            type="text"
            size="small"
            icon="reset"
            @click="resetFontFamily"
          />
        </template>
      </Input>
    </div>
    <div v-platform="[OS.Linux]" class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">
        {{ $t('settings.systemTitleBar') }}
        <span class="font-normal text-12">({{ $t('settings.needRestart') }})</span>
      </div>
      <Switch v-model="appSettings.app.systemTitleBar" />
    </div>
    <div class="px-8 py-12 flex items-center justify-between">
      <div class="text-16 font-bold">{{ $t('settings.pages.name') }}</div>
      <CheckBox v-model="appSettings.app.pages" :options="pages" />
    </div>
  </Card>
</template>
