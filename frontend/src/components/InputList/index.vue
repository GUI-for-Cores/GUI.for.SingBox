<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

import { DraggableOptions } from '@/constant/app'

import Input from '@/components/Input/index.vue'

interface Props {
  placeholder?: string
  autofocus?: boolean
}

withDefaults(defineProps<Props>(), { autofocus: true })

const list = defineModel<string[]>({ default: [] })

const value = ref('')
const inputRef = useTemplateRef<typeof Input>('inputRef')

const handleAdd = () => {
  if (!value.value) return
  list.value.push(value.value)
  value.value = ''
  inputRef.value?.focus()
}

const handleDel = (i: number) => list.value.splice(i, 1)
</script>

<template>
  <div class="inline-block rounded-4">
    <div v-draggable="[list, DraggableOptions]" class="flex flex-col gap-2">
      <TransitionGroup name="list">
        <Card v-for="(l, i) in list" :key="i">
          <div class="flex items-center justify-between py-4 break-all">
            {{ l }}
            <Button @click="handleDel(i)" icon="close" :icon-size="10" type="text" />
          </div>
        </Card>
      </TransitionGroup>
    </div>

    <Input
      ref="inputRef"
      v-model="value"
      :placeholder="placeholder"
      @keydown.enter="handleAdd"
      type="text"
      auto-size
      :autofocus="autofocus"
      class="mt-4"
    >
      <template #extra>
        <Button @click="handleAdd" icon="add" size="small" type="primary" class="mr-4" />
      </template>
    </Input>
  </div>
</template>

<style lang="less" scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
