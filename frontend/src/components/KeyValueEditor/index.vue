<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  modelValue?: Recordable
  placeholder?: [string, string]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  placeholder: () => ['key', 'value'],
})

const emit = defineEmits(['change', 'update:modelValue'])

const entries = ref(Object.entries(props.modelValue))

const handleDel = (i: number) => {
  entries.value.splice(i, 1)
  emitUpdate()
}

const handleAdd = () => {
  entries.value.push(['', ''])
  emitUpdate()
}

let internalUpdate = false

watch(
  () => props.modelValue,
  (val) => {
    if (!internalUpdate) {
      entries.value = Object.entries(val)
    }
    internalUpdate = false
  },
  { deep: true },
)

const emitUpdate = () => {
  const obj = Object.fromEntries(entries.value)
  if (!internalUpdate) {
    emit('update:modelValue', obj)
  }
  emit('change', obj)
  internalUpdate = true
}
</script>

<template>
  <div class="gui-kv-editor inline-flex flex-col">
    <div v-for="(entry, i) in entries" :key="i" class="flex items-center mb-4">
      <Input
        v-model="entry[0]"
        :placeholder="placeholder[0]"
        auto-size
        class="flex-1"
        @submit="emitUpdate"
      />
      <Button type="text" :icon-size="12" icon="close" @click="handleDel(i)" />
      <Input
        v-model="entry[1]"
        :placeholder="placeholder[1]"
        auto-size
        class="flex-1"
        @submit="emitUpdate"
      />
    </div>
    <Button type="primary" icon="add" @click="handleAdd" />
  </div>
</template>

<style lang="less" scoped>
.gui-kv-editor {
  min-width: 400px;
}
</style>
