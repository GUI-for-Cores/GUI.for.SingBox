<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  placeholder?: [string, string]
}

const model = defineModel<Record<string, string>>({ default: {} })

withDefaults(defineProps<Props>(), {
  placeholder: () => ['key', 'value']
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
      {} as Record<string, string>
    )
    model.value = obj
  },
  { deep: true }
)
</script>

<template>
  <div class="kv-editor">
    <div v-for="(key, i) in keys" :key="i" class="item">
      <Input v-model="keys[i]" :placeholder="placeholder[0]" />
      <Button @click="handleDel(i)" type="text" size="small" :icon-size="12" icon="close" />
      <Input v-model="values[i]" :placeholder="placeholder[1]" />
    </div>
    <Button @click="handleAdd" type="primary" icon="add" />
  </div>
</template>

<style lang="less" scoped>
.kv-editor {
  display: inline-flex;
  flex-direction: column;
  min-width: 219px;
  .item {
    display: flex;
    align-items: center;
    margin: 0 2px 4px 2px;
  }
}
</style>
