<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, useTemplateRef } from 'vue'

import { useAppSettingsStore, useAppStore, usePluginsStore } from '@/stores'
import { debounce, message } from '@/utils'
import { getCommands } from '@/utils/command'

import Input from '@/components/Input/index.vue'

const props = defineProps<{
  close: () => void
}>()

const loading = ref(false)
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

const appStore = useAppStore()
const appSettings = useAppSettingsStore()
const pluginsStore = usePluginsStore()

const handleExecCommand = async (index: number) => {
  if (loading.value) return

  loading.value = true
  try {
    await hitCommand.value[index]?.handler?.()
    userInput.value = ''
    props.close()
  } catch (error: any) {
    message.error(error.message || error)
  }
  loading.value = false
  nextTick(inputRef.value!.focus)
}

const onKeydown = async (ev: KeyboardEvent) => {
  if (loading.value) return

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
  <ModalContainer :empty="hitCommand.length === 0">
    <template #top>
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
    </template>

    <template #empty>
      <Empty description="commands.noMatching" />
    </template>

    <template #body>
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
    </template>
  </ModalContainer>
</template>
