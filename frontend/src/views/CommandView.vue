<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppSettingsStore, useAppStore, usePluginsStore } from '@/stores'
import { debounce, message } from '@/utils'
import { getCommands } from '@/utils/command'

import Input from '@/components/Input/index.vue'

const loading = ref(false)
const showCommandPanel = ref(false)
const userInput = ref('')
const selected = ref(0)
const inputRef = useTemplateRef<typeof Input>('inputRef')
const commands = ref(getCommands())
const commandsRefMap: Record<string, HTMLElement> = {}

const hitCommand = computed(() =>
  userInput.value
    ? commands.value.filter(
        (v) =>
          v.cmd.toLocaleLowerCase().includes(userInput.value) ||
          v.label.toLocaleLowerCase().includes(userInput.value),
      )
    : commands.value,
)

const { t } = useI18n()
const appStore = useAppStore()
const appSettings = useAppSettingsStore()
const pluginsStore = usePluginsStore()

const handleExecCommand = async (index: number) => {
  loading.value = true
  try {
    await hitCommand.value[index]?.handler?.()
    userInput.value = ''
    showCommandPanel.value = false
  } catch (error: any) {
    message.error(error.message || error)
  }
  loading.value = false
  nextTick(inputRef.value!.focus)
}

const onKeydown = async (ev: KeyboardEvent) => {
  if (((ev.ctrlKey && ev.shiftKey) || ev.metaKey) && ev.code === 'KeyP') {
    ev.preventDefault()
    showCommandPanel.value = true
    nextTick(inputRef.value!.focus)
    return
  }

  if (!showCommandPanel.value || loading.value) return

  if (ev.code === 'Escape') {
    if (userInput.value) {
      userInput.value = ''
      return
    }
    showCommandPanel.value = false
    return
  }
  if (ev.code === 'ArrowUp') {
    selected.value = selected.value - 1 < 0 ? 0 : selected.value - 1
    commandsRefMap[hitCommand.value[selected.value]!.label]?.scrollIntoView({ block: 'nearest' })
    return
  }
  if (ev.code === 'ArrowDown') {
    selected.value =
      selected.value + 1 >= hitCommand.value.length
        ? hitCommand.value.length - 1
        : selected.value + 1
    commandsRefMap[hitCommand.value[selected.value]!.label]?.scrollIntoView({ block: 'nearest' })
    return
  }
  if (ev.code === 'Enter') {
    if (hitCommand.value.length) {
      await handleExecCommand(selected.value)
    } else {
      nextTick(inputRef.value!.focus)
    }
  }
}

watch(hitCommand, () => (selected.value = 0))

const updateCommands = debounce(() => {
  commands.value = getCommands()
}, 200)

watch([() => appSettings.app.lang, pluginsStore.plugins, () => appStore.locales], updateCommands)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    v-show="showCommandPanel"
    class="fixed z-9999 left-1/2 -translate-x-1/2 shadow rounded-4 min-w-[50%]"
    style="top: 40px; background: var(--modal-bg)"
  >
    <div class="p-6 shadow">
      <Input
        ref="inputRef"
        v-model="userInput"
        :disabled="loading"
        autofocus
        clearable
        class="w-full"
      >
        <template #prefix>
          <Icon icon="arrowRight" />
        </template>
        <template #suffix>
          <Icon v-show="loading" icon="loading" class="rotation" />
        </template>
      </Input>
    </div>
    <div class="overflow-y-auto p-8" style="max-height: calc(100vh - 130px)">
      <div
        v-for="(c, index) in hitCommand"
        :key="c.label"
        :ref="(el: any) => (commandsRefMap[c.label] = el)"
      >
        <Card
          :title="c.label"
          :selected="index === selected"
          class="mt-4"
          style="font-size: 12px"
          @click="handleExecCommand(index)"
        >
          <div>{{ c.desc }}</div>
          <div>{{ c.cmd }}</div>
        </Card>
      </div>
      <div v-show="hitCommand.length === 0" class="p-4 text-12">
        {{ t('commands.noMatching') }}
      </div>
    </div>
  </div>
</template>
