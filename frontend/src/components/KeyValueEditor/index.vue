<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  placeholder?: [string, string]
}

const model = defineModel<Record<string, string>>({ default: {} })

withDefaults(defineProps<Props>(), {
  placeholder: () => ['key', 'value'],
})

const keys = ref(Object.keys(model.value))
const values = ref(Object.values(model.value))

const handleDel = (i: number) => {
  keys.value.splice(i, 1)
  values.value.splice(i, 1)
}

const handleAdd = () => {
  keys.value.push('')
  values.value.push('')
}

watch(
  [keys, values],
  ([keys, values]) => {
    const obj = keys.reduce(
      (obj, key, index) => {
        obj[key] = values[index]
        return obj
      },
      {} as Record<string, string>,
    )
    model.value = obj
  },
  { deep: true },
)
</script>

<template>
  <div class="gui-kv-editor inline-flex flex-col">
    <div v-for="(key, i) in keys" :key="i" class="flex items-center mr-2 mb-4 ml-2">
      <Input v-model="keys[i]" :placeholder="placeholder[0]" />
      <Button @click="handleDel(i)" type="text" size="small" :icon-size="12" icon="close" />
      <Input v-model="values[i]" :placeholder="placeholder[1]" />
    </div>
    <Button @click="handleAdd" type="primary" icon="add" />
  </div>
</template>

<style lang="less" scoped>
.gui-kv-editor {
  min-width: 219px;
}
</style>
