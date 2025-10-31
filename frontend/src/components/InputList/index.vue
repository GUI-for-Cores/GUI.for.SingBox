<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

import { DraggableOptions } from '@/constant/app'
import { sampleID } from '@/utils'

import Input from '@/components/Input/index.vue'

interface Props {
  modelValue?: string[]
  placeholder?: string
  autofocus?: boolean
}

interface Item {
  value: string
  id: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  autofocus: true,
})

const emit = defineEmits(['change', 'update:modelValue'])

const innerList = ref<Item[]>(props.modelValue.map((v, i) => ({ value: v, id: i.toString() })))

const editItem = ref<Item>()
const inputVal = ref('')
const inputRef = useTemplateRef<typeof Input>('inputRef')

const handleAdd = () => {
  const item = editItem.value
  editItem.value = undefined
  if (!inputVal.value) return
  if (item) {
    item.value = inputVal.value
  } else {
    innerList.value.push({ value: inputVal.value, id: sampleID() })
  }
  inputVal.value = ''
  inputRef.value?.focus()
  emitUpdate()
}

const handleEdit = (item: Item) => {
  editItem.value = item
  inputVal.value = editItem.value.value
  inputRef.value?.focus()
}

const handleDel = (item: Item) => {
  const idx = innerList.value.indexOf(item)
  if (idx !== -1) {
    innerList.value.splice(idx, 1)
    emitUpdate()
  }
}

let internalUpdate = false

watch(
  () => props.modelValue,
  (val) => {
    if (!internalUpdate) {
      innerList.value.splice(0)
      innerList.value.push(...val.map((v, i) => ({ value: v, id: i.toString() })))
    }
    internalUpdate = false
  },
  {
    deep: true,
  },
)

const emitUpdate = () => {
  internalUpdate = true
  const list = innerList.value.map((v) => v.value)
  emit('update:modelValue', list)
  emit('change', list)
}
</script>

<template>
  <div class="gui-input-list inline-block rounded-4">
    <div
      v-draggable="[innerList, { ...DraggableOptions, onUpdate: emitUpdate }]"
      class="flex flex-col gap-2"
    >
      <TransitionGroup name="list">
        <Card v-for="item in innerList" :key="item.id">
          <div class="flex items-center py-4 break-all">
            <span class="mr-auto">{{ item.value }}</span>
            <Button
              @click="handleEdit(item)"
              icon="edit"
              :icon-size="12"
              size="small"
              type="text"
            />
            <Button
              @click="handleDel(item)"
              icon="close"
              :icon-size="12"
              size="small"
              type="text"
            />
          </div>
        </Card>
      </TransitionGroup>
    </div>

    <Input
      ref="inputRef"
      v-model="inputVal"
      :placeholder="placeholder"
      @keydown.enter="handleAdd"
      type="text"
      clearable
      :autofocus="autofocus"
      class="mt-4 w-full"
    >
      <template #suffix>
        <Button @click="handleAdd" :icon="editItem ? 'edit' : 'add'" size="small" type="primary" />
      </template>
    </Input>
  </div>
</template>

<style lang="less" scoped>
.gui-input-list {
  min-width: 220px;
}
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
