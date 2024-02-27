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
      <Button @click="handleDel(i)" type="text" class="ml-4" size="small"> × </Button>
      <Input v-model="values[i]" :placeholder="placeholder[1]" />
    </div>
    <Button @click="handleAdd" type="primary" size="small" class="add">+</Button>
  </div>
</template>

<style lang="less" scoped>
.kv-editor {
  padding: 0 8px 0 8px;
  display: inline-block;
  flex-direction: column;
  min-width: 224px;
  .item {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }
  .ml-4 {
    margin-left: 4px;
  }
  .add {
    margin: 0 -2px 0 -2px;
    display: flex;
  }
}
</style>
