<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

import { useMessage } from '@/hooks'
import { getCommands } from '@/utils/command'
import { useAppSettingsStore } from '@/stores'

const loading = ref(false)
const showCommandPanel = ref(false)
const userInput = ref('')
const selected = ref(0)
const inputRef = ref()
const commands = ref(getCommands())
let commandsRefMap: Record<string, HTMLElement> = {}

const hitCommand = computed(() =>
  userInput.value
    ? commands.value.filter(
        (v) =>
          v.cmd.toLocaleLowerCase().includes(userInput.value) ||
          v.label.toLocaleLowerCase().includes(userInput.value)
      )
    : commands.value
)

const { t } = useI18n()
const { message } = useMessage()
const appSettings = useAppSettingsStore()

const handleExecCommand = async (index: number) => {
  loading.value = true
  try {
    await hitCommand.value[index].handler?.()
    userInput.value = ''
    showCommandPanel.value = false
  } catch (error: any) {
    message.error(error.message || error)
  }
  loading.value = false
  nextTick(inputRef.value.focus)
}

const onKeydown = async (ev: KeyboardEvent) => {
  if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyP') {
    ev.preventDefault()
    showCommandPanel.value = true
    nextTick(inputRef.value.focus)
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
    commandsRefMap[hitCommand.value[selected.value].label].scrollIntoView({ block: 'nearest' })
    return
  }
  if (ev.code === 'ArrowDown') {
    selected.value =
      selected.value + 1 >= hitCommand.value.length
        ? hitCommand.value.length - 1
        : selected.value + 1
    commandsRefMap[hitCommand.value[selected.value].label].scrollIntoView({ block: 'nearest' })
    return
  }
  if (ev.code === 'Enter') {
    if (hitCommand.value.length) {
      await handleExecCommand(selected.value)
    }
  }
}

watch(hitCommand, () => (selected.value = 0))

watch(
  () => appSettings.app.lang,
  () => {
    commands.value = getCommands()
  }
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-show="showCommandPanel" class="command-view">
    <div class="input-view">
      <Icon icon="arrowRight" class="command-arrow" />
      <Input ref="inputRef" v-model="userInput" :disabled="loading" autofocus pl="24px" />
      <Icon v-show="loading" icon="loading" class="rotation" />
    </div>
    <div class="commands">
      <div
        v-for="(c, index) in hitCommand"
        :key="c.label"
        :ref="(el: any) => (commandsRefMap[c.label] = el)"
      >
        <Card
          :title="c.label"
          :selected="index === selected"
          @click="handleExecCommand(index)"
          class="mt-4"
          style="font-size: 12px"
        >
          <div>{{ c.desc }}</div>
          <div>{{ c.cmd }}</div>
        </Card>
      </div>
      <div class="no-cmds" v-show="hitCommand.length === 0">
        {{ t('commands.noMatching') }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.command-view {
  position: fixed;
  z-index: 9999;
  top: 40px;
  left: 50%;
  border-radius: 4px;
  min-width: 50%;
  transform: translateX(-50%);
  background: var(--modal-bg);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

.input-view {
  padding: 6px;
  position: relative;
  box-shadow: 0 8px 8px rgba(0, 0, 0, 0.06);
  z-index: 9;
}

.command-arrow {
  position: absolute;
  top: 13px;
  left: 12px;
}

.commands {
  overflow-y: auto;
  max-height: calc(100vh - 130px);
  padding: 8px;
}

.no-cmds {
  padding: 4px;
  font-size: 12px;
}

.rotation {
  position: absolute;
  top: 13px;
  right: 8px;
  animation: rotate 2s infinite linear;
}
</style>
